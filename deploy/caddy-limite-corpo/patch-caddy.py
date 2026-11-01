#!/usr/bin/env python3
# Acrescenta, nos blocos do app (america, demo e clientes), um limite de corpo PEQUENO para /api/*, mantendo o limite de 16 MiB
# onde ele é preciso: nas rotas de foto. Os dois request_body convivem: vale o menor. Idempotente: se já foi aplicado, não faz nada.
# Uso: python3 patch-caddy.py <Caddyfile>      (grava o arquivo; faça a cópia de segurança antes)
import sys

ORIGINAL = "\trequest_body {\n\t\tmax_size 16MiB\n\t}\n"
ACRESCENTO = (
    "\t@api_pequena {\n"
    "\t\tpath /api/*\n"
    "\t\tnot path /api/services/*/image /api/users/*/avatar\n"
    "\t}\n"
    "\trequest_body @api_pequena {\n"
    "\t\tmax_size 64KB\n"
    "\t}\n"
)

caminho = sys.argv[1]
texto = open(caminho, encoding="utf-8").read()
if "@api_pequena" in texto:
    print("Já aplicado: nada a fazer.")
    sys.exit(0)
n = texto.count(ORIGINAL)
if n < 1:
    sys.exit("ERRO: não achei o bloco 'request_body { max_size 16MiB }' esperado. Nada foi alterado.")
open(caminho, "w", encoding="utf-8", newline="\n").write(texto.replace(ORIGINAL, ORIGINAL + ACRESCENTO))
print(f"OK: limite de 64KB aplicado em {n} bloco(s).")
