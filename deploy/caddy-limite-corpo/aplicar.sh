#!/usr/bin/env bash
# Limite de corpo pequeno (64 KB) para /api/* nos domínios do app, mantendo 16 MiB só nas rotas de foto.
# Roda NA VPS, como root:   bash aplicar.sh
# Faz cópia do Caddyfile, aplica o patch, VALIDA antes de recarregar e, se a validação falhar, restaura o original.
# O reload do Caddy é gracioso (não derruba conexões). A América, a demo e os clientes passam pelo mesmo Caddy: por isso a validação.
set -euo pipefail

BASE=/opt/navalha
ARQ="$BASE/caddy/Caddyfile"
CONTAINER=navalha-caddy-1
COPIA="$BASE/backup-config/Caddyfile.antes-limite-corpo-$(date +%Y%m%d-%H%M%S)"
AQUI="$(cd "$(dirname "$0")" && pwd)"

erro() { echo "ERRO: $*" >&2; exit 1; }
[ -f "$ARQ" ] || erro "não achei $ARQ"
[ -f "$AQUI/patch-caddy.py" ] || erro "patch-caddy.py precisa estar na mesma pasta deste script"
command -v python3 >/dev/null || erro "python3 não está instalado"
docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" || erro "o container $CONTAINER não está rodando"

mkdir -p "$BASE/backup-config"
cp -p "$ARQ" "$COPIA"
echo "Cópia do Caddyfile atual: $COPIA"

python3 "$AQUI/patch-caddy.py" "$ARQ"

if ! docker exec "$CONTAINER" caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
  cp -p "$COPIA" "$ARQ"
  erro "o Caddyfile novo NÃO é válido. Restaurei o original e NADA foi recarregado."
fi
echo "Caddyfile novo validado."

docker exec "$CONTAINER" caddy reload --config /etc/caddy/Caddyfile
echo "Caddy recarregado. Conferindo os sites..."
for h in america demo vitorbarber69; do
  printf '  %-16s HTTP ' "$h"
  curl -s -o /dev/null -m 20 -w '%{http_code}\n' "https://$h.navalhaapp.tech/login" || echo "sem resposta"
done
echo
echo "Para VOLTAR atrás:  cp -p $COPIA $ARQ && docker exec $CONTAINER caddy reload --config /etc/caddy/Caddyfile"
