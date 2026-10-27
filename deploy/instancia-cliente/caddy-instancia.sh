#!/usr/bin/env bash
# Põe a instalação de um cliente no ar pelo Caddy: acrescenta o bloco <slug>.navalhaapp.tech ao Caddyfile,
# valida ANTES de aplicar, faz cópia e recarrega. Se o recarregamento falhar, devolve o Caddyfile anterior.
# Roda NA VPS, como root:   bash caddy-instancia.sh <slug>
# Pré-requisitos: o DNS A de <slug>.navalhaapp.tech aponta para esta VPS e o <slug>-app já está de pé.
set -euo pipefail

slug="${1:-}"
BASE=/opt/navalha
CADDYFILE=$BASE/caddy/Caddyfile
BACKUPS=$BASE/backup-config
CTR=navalha-caddy-1
MARCA="instalacao-cliente:$slug"

erro() { echo "ERRO: $*" >&2; exit 1; }

[ -n "$slug" ] || erro "uso: bash caddy-instancia.sh <slug>"
[[ "$slug" =~ ^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?$ ]] || erro "slug inválido: $slug"
case "$slug" in www|app|api|admin|painel|login|static|mail|america|demo) erro "slug reservado: $slug" ;; esac
[ -f "$CADDYFILE" ] || erro "não achei $CADDYFILE"
grep -q "$MARCA" "$CADDYFILE" && erro "o bloco de $slug já existe no Caddyfile (nada foi alterado)"
docker ps --format '{{.Names}}' | grep -qx "navalha-$slug-app-1" || erro "o container navalha-$slug-app-1 não está rodando (suba o app antes)"

ip_dns="$(getent hosts "$slug.navalhaapp.tech" | awk '{print $1}' | head -1 || true)"
ip_vps="$(curl -s --max-time 5 https://api.ipify.org || true)"
echo "DNS: $slug.navalhaapp.tech -> ${ip_dns:-NÃO RESOLVE}   (IP desta VPS: ${ip_vps:-?})"
[ -n "$ip_dns" ] || erro "o DNS de $slug.navalhaapp.tech ainda não resolve: crie o registro A antes (o Caddy não consegue o certificado sem ele)"

ts="$(date +%Y%m%d-%H%M%S)"
novo="$CADDYFILE.novo"
cp -p "$CADDYFILE" "$novo"
cat >> "$novo" <<EOF

# $MARCA: app e banco próprios (deploy/instancia-cliente), sem WhatsApp.
$slug.navalhaapp.tech {
	request_body {
		max_size 16MiB
	}
	reverse_proxy $slug-app:3000 {
		header_up X-Real-IP {remote_host}
	}
	header -Server
	header -X-Powered-By
}
EOF

echo "--- Diferença que será aplicada"
diff -u "$CADDYFILE" "$novo" || true

echo "--- Validando o Caddyfile novo (ainda não aplicado)"
docker exec "$CTR" caddy validate --config /etc/caddy/Caddyfile.novo --adapter caddyfile >/dev/null \
  || { rm -f "$novo"; erro "o Caddyfile novo é inválido; nada foi alterado"; }

cp -p "$CADDYFILE" "$BACKUPS/Caddyfile.antes-$slug-$ts"
mv "$novo" "$CADDYFILE"
echo "Cópia do anterior: $BACKUPS/Caddyfile.antes-$slug-$ts"

if ! docker exec "$CTR" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
  echo "O reload falhou: devolvendo o Caddyfile anterior" >&2
  cp -p "$BACKUPS/Caddyfile.antes-$slug-$ts" "$CADDYFILE"
  docker exec "$CTR" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  erro "voltou ao estado anterior"
fi
echo "Caddy recarregado. O certificado do $slug.navalhaapp.tech sai em até um minuto."

echo
echo "--- Conferência (de dentro da VPS)"
sleep 5
for h in navalhaapp.tech america.navalhaapp.tech demo.navalhaapp.tech "$slug.navalhaapp.tech"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 --resolve "$h:443:127.0.0.1" "https://$h/" || echo falhou)
  echo "$h  ->  HTTP $code"
done
echo "Para desfazer: cp -p $BACKUPS/Caddyfile.antes-$slug-$ts $CADDYFILE && docker exec $CTR caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile"
