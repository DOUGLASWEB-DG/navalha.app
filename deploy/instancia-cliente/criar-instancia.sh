#!/usr/bin/env bash
# Prepara uma INSTALAÇÃO DE CLIENTE na VPS (app e banco próprios), sem tocar na América nem na demo.
# Roda NA VPS, como root:   bash criar-instancia.sh <slug> <plano: essencial|completo> <tag-da-imagem>
#   ex.: bash criar-instancia.sh barbeariac essencial 18ec82e
#
# Gera (nada disto sobe sozinho): <slug>.env e <slug>-postgres.env (modo 600, segredos novos e aleatórios),
# compose.<slug>.yml (serviços <slug>-db e <slug>-app), scripts/backup-<slug>.sh, scripts/testar-restauracao-<slug>.sh
# e /etc/cron.d/navalha-backup-<slug>. No fim imprime os próximos passos já com o nome preenchido.
# Se qualquer arquivo já existir, aborta sem alterar nada (não sobrescreve segredo nem backup).
set -euo pipefail

slug="${1:-}"; plano="${2:-}"; tag="${3:-}"
BASE=/opt/navalha

erro() { echo "ERRO: $*" >&2; exit 1; }

[ "$(id -u)" = "0" ] || erro "rode como root"
[ -n "$slug" ] && [ -n "$plano" ] && [ -n "$tag" ] || erro "uso: bash criar-instancia.sh <slug> <essencial|completo> <tag-da-imagem>"
[[ "$slug" =~ ^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?$ ]] || erro "slug inválido (use minúsculas, números e hífen): $slug"
case "$slug" in www|app|api|admin|painel|login|static|mail|america|demo|navalha|caddy|evolution|db|cron) erro "slug reservado: $slug" ;; esac
case "$plano" in essencial|completo) ;; *) erro "plano deve ser essencial ou completo" ;; esac
docker image inspect "navalha-app:$tag" >/dev/null 2>&1 || erro "imagem navalha-app:$tag não existe nesta VPS (envie com docker save | ssh docker load)"
docker network inspect navalha_default >/dev/null 2>&1 || erro "rede navalha_default não existe (rode de /opt/navalha, onde está o compose.yml)"

us="${slug//-/_}"
arquivos=("$BASE/$slug.env" "$BASE/$slug-postgres.env" "$BASE/compose.$slug.yml" "$BASE/scripts/backup-$slug.sh" "$BASE/scripts/testar-restauracao-$slug.sh" "/etc/cron.d/navalha-backup-$slug")
for f in "${arquivos[@]}"; do [ ! -e "$f" ] || erro "já existe: $f (nada foi alterado)"; done
cd "$BASE"

umask 077
senha_db="$(openssl rand -hex 24)"
jwt="$(openssl rand -base64 48 | tr -d '\n')"

cat > "$slug-postgres.env" <<EOF
POSTGRES_USER=navalha_$us
POSTGRES_DB=navalha_$us
POSTGRES_PASSWORD=$senha_db
EOF

# Sem EVO_* de propósito: esta instalação nunca fala com o WhatsApp da América (e NAVALHA_PLANO=essencial também desliga o envio)
cat > "$slug.env" <<EOF
DATABASE_URL=postgresql://navalha_$us:$senha_db@$slug-db:5432/navalha_$us
DIRECT_URL=postgresql://navalha_$us:$senha_db@$slug-db:5432/navalha_$us
JWT_SECRET=$jwt
TENANT_ROOT_DOMAIN=navalhaapp.tech
RATE_LIMIT_IP_HEADER=x-real-ip
NAVALHA_PLANO=$plano
EOF

umask 022
cat > "compose.$slug.yml" <<EOF
# Instalação do cliente "$slug" (plano $plano). Sempre use junto do compose principal:
#   docker compose -f compose.yml -f compose.$slug.yml <comando>
services:
  $slug-db:
    image: postgres:17-alpine
    restart: unless-stopped
    env_file: ./$slug-postgres.env
    mem_limit: 384m
    cpus: 0.4
    volumes:
      - postgres_$us:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U navalha_$us -d navalha_$us"]
      interval: 10s
      timeout: 5s
      retries: 5

  $slug-app:
    # Mesma imagem da América. Sem EVO_* e sem robô de lembretes: nada de WhatsApp aqui.
    image: navalha-app:$tag
    restart: unless-stopped
    env_file: ./$slug.env
    mem_limit: 512m
    cpus: 0.5
    volumes:
      - ${us}_uploads:/data/uploads
    depends_on:
      $slug-db:
        condition: service_healthy

volumes:
  postgres_$us:
  ${us}_uploads:
EOF

mkdir -p "$BASE/scripts" "$BASE/backup/$slug"

# --- backup diário desta instalação (a da América continua no backup.sh dela)
cat > "scripts/backup-$slug.sh" <<'EOF'
#!/bin/sh
# Backup diário da instalação __SLUG__: banco e fotos. Guarda 14 dias em /opt/navalha/backup/__SLUG__.
set -eu
SLUG=__SLUG__
US=__US__
BASE=/opt/navalha/backup/$SLUG
DEST=$BASE/$(date -u +%Y-%m-%d_%H%M)
mkdir -p "$DEST"
docker exec navalha-$SLUG-db-1 pg_dump -U navalha_$US -d navalha_$US -Fc > "$DEST/banco.dump"
docker run --rm -v navalha_${US}_uploads:/data/uploads:ro -v "$DEST":/backup alpine tar czf /backup/fotos.tar.gz -C /data/uploads .
for f in banco.dump fotos.tar.gz; do
  [ -s "$DEST/$f" ] || { echo "$(date -u) FALHA: $f vazio em $DEST"; exit 1; }
done
(cd "$DEST" && sha256sum banco.dump fotos.tar.gz > SHA256SUMS)
chmod 600 "$DEST"/*
ln -sfn "$DEST" "$BASE/ultimo"
find "$BASE" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
echo "$(date -u) OK: $DEST ($(du -sh "$DEST" | cut -f1))"
EOF

cat > "scripts/testar-restauracao-$slug.sh" <<'EOF'
#!/bin/sh
# Restaura o último backup da instalação __SLUG__ num banco temporário, compara a contagem de registros e apaga o temporário.
set -eu
SLUG=__SLUG__
US=__US__
DUMP=/opt/navalha/backup/$SLUG/ultimo/banco.dump
[ -s "$DUMP" ] || { echo "$(date -u) FALHA: sem backup de $SLUG para testar"; exit 1; }
(cd /opt/navalha/backup/$SLUG/ultimo && sha256sum -c --quiet SHA256SUMS) || { echo "$(date -u) FALHA: checksum do backup de $SLUG nao confere"; exit 1; }
C=navalha-$SLUG-db-1
Q='select (select count(*) from "User"),(select count(*) from "Client"),(select count(*) from "Service"),(select count(*) from "Appointment"),(select count(*) from "Transaction"),(select count(*) from "Category")'
docker exec $C psql -U navalha_$US -d postgres -qc "DROP DATABASE IF EXISTS teste_restauracao" >/dev/null
docker exec $C psql -U navalha_$US -d postgres -qc "CREATE DATABASE teste_restauracao" >/dev/null
docker exec -i $C pg_restore -U navalha_$US -d teste_restauracao --no-owner < "$DUMP"
RESTAURADO=$(docker exec $C psql -U navalha_$US -d teste_restauracao -At -F / -c "$Q")
REAL=$(docker exec $C psql -U navalha_$US -d navalha_$US -At -F / -c "$Q")
docker exec $C psql -U navalha_$US -d postgres -qc "DROP DATABASE teste_restauracao" >/dev/null
echo "$(date -u) $SLUG restauracao: usuarios/clientes/servicos/agendamentos/transacoes/categorias backup=$RESTAURADO atual=$REAL"
[ "$RESTAURADO" = "$REAL" ] && echo "$(date -u) OK: backup de $SLUG restaura e confere" || echo "$(date -u) AVISO: diferente do atual (normal se houve cadastro depois do backup)"
EOF
sed -i "s/__SLUG__/$slug/g; s/__US__/$us/g" "scripts/backup-$slug.sh" "scripts/testar-restauracao-$slug.sh"
chmod 700 "scripts/backup-$slug.sh" "scripts/testar-restauracao-$slug.sh"

# 07:10 UTC (a da América é 07:00); teste de restauração aos domingos, 07:50
cat > "/etc/cron.d/navalha-backup-$slug" <<EOF
10 7 * * * root /opt/navalha/scripts/backup-$slug.sh >> /var/log/navalha-backup.log 2>&1
50 7 * * 0 root /opt/navalha/scripts/testar-restauracao-$slug.sh >> /var/log/navalha-backup.log 2>&1
EOF
chmod 644 "/etc/cron.d/navalha-backup-$slug"

DC="docker compose -f compose.yml -f compose.$slug.yml"
echo "OK: instalação '$slug' preparada (plano $plano, imagem $tag). Nada subiu ainda."
echo
echo "Próximos passos (de /opt/navalha, um de cada vez, conferindo a saída):"
echo "  1) $DC config -q && $DC up -d $slug-db"
echo "  2) $DC ps     # espere o $slug-db ficar (healthy)"
echo "  3) docker run --rm --network navalha_default --env-file $slug.env navalha-migrate:$tag npx prisma migrate deploy"
echo "  4) OBRIGATÓRIO antes de abrir no Caddy: criar a barbearia e o proprietário (scripts/criar-barbearia.ts, com o hash da senha)"
# Sem "!" no código JS: dentro de aspas, o bash interativo trata "!" como expansão de histórico ("event not found")
echo "  5) docker run --rm -v navalha_${us}_uploads:/data/uploads navalha-app:$tag node -e \"require('fs').writeFileSync('/data/uploads/.navalha-uploads','Pasta de fotos de $slug.\\n',{flag:'a'})\""
echo "  6) $DC up -d $slug-app"
echo "  7) bash /root/instancia-cliente/caddy-instancia.sh $slug"
echo "     (antes disso o DNS A de $slug.navalhaapp.tech precisa existir. Cole só o comando, sem esta observação)"
echo "  8) /opt/navalha/scripts/backup-$slug.sh && /opt/navalha/scripts/testar-restauracao-$slug.sh"
