# Deploy em VPS com Docker

Estado: **guia preparado, ainda não executado em produção.** Tudo abaixo marcado como "comprovado" foi testado em
2026-10-19 numa máquina Windows com Docker Desktop (x86_64), com o banco LOCAL. Nada foi feito na VPS.

Cada passo que toca produção (backup, migrations, variáveis, volume, proxy, domínio) precisa de autorização própria.

## 1. O que vai na imagem e o que fica fora

- `Dockerfile` em 3 estágios: `deps` (npm ci), `builder` (prisma generate + next build), `runner` (standalone do Next,
  usuário `nextjs` uid 1001, base `node:20-alpine`).
- `.dockerignore` deixa fora `.env`, `.env.*` (exceto `.env.example`), `.uploads`, `node_modules`, `.next` e `.git`.
  Motivo: o Next lê `.env*` durante o build; se entrassem, os valores ficariam gravados na imagem.
  Comprovado: `ls /app/.env*` na imagem final não encontra nada.
- Segredos entram **só** pelo ambiente do container (arquivo de env na VPS com permissão 600, fora do Git).

## 2. Variáveis de ambiente

Os nomes estão em `.env.example`. Em produção:

| Variável | Observação |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | banco de produção (decisão pendente: Supabase atual ou Postgres em Docker na VPS) |
| `JWT_SECRET` | obrigatório; trocar invalida todas as sessões |
| `TENANT_ROOT_DOMAIN` | `navalha.app` (subdomínios das barbearias); a América também responde em `americabarbearia.tech` (`Barbearia.customDomain`) |
| `UPLOADS_DIR` | já vem `/data/uploads` na imagem; só mude junto com o ponto de montagem |
| `RATE_LIMIT_IP_HEADER` | cabeçalho de IP que o proxy da VPS **sobrescreve** (ex.: `x-real-ip`); vazio = sem limite por IP. Nunca aponte para um cabeçalho que o cliente consiga forjar |
| `EVO_API_KEY`, `NEXT_PUBLIC_EVO_URL`, `ADMIN_PHONE` | WhatsApp (Evolution); `NEXT_PUBLIC_*` é lido no **build**, não no start |

## 3. Fotos: volume persistente

As fotos ficam em `/data/uploads/<barbeariaId>/<services|avatars>/<uuid>.webp`. A imagem cria `/data/uploads` vazia,
do usuário `nextjs`, **sem** o marcador `.navalha-uploads` e sem `VOLUME` no Dockerfile. Sem o volume montado e
inicializado, o envio responde 503 e nada é gravado (não grava dentro do container para perder no próximo deploy).

```yaml
services:
  navalha:
    image: navalha-app:<versao>
    env_file: /opt/navalha/navalha.env   # chmod 600, fora do Git
    volumes:
      - navalha_uploads:/data/uploads
volumes:
  navalha_uploads:
```

Uma vez por volume (a imagem final não tem `npm run`/`tsx`; este comando faz o mesmo que `npm run uploads:init`):

```sh
docker run --rm -v navalha_uploads:/data/uploads navalha-app:<versao> node -e "const fs=require('fs');const p='/data/uploads/.navalha-uploads';if(!fs.existsSync(p))fs.writeFileSync(p,'Pasta de fotos do Navalha.app, inicializada em '+new Date().toISOString()+'.\n')"
```

Comprovado no container (volume nomeado novo):
- o volume herda o dono uid 1001 na primeira montagem;
- sem marcador: envio responde 503 com a mensagem de volume não montado;
- depois do comando acima: envio 200, foto servida como `image/webp`;
- container removido e recriado com o mesmo volume: a foto continua respondendo 200;
- a mesma URL no host de outra barbearia responde 404.

**sharp na imagem final (comprovado):** dentro do container, como `nextjs`, a partir do standalone, sharp 0.34.5 /
libvips 8.17.3 (binário `linuxmusl-x64`) converteu um JPEG 1600x1200 com EXIF para WebP 800x600 sem EXIF, e o envio
real pela API funcionou. **NÃO COMPROVADO** em VPS ARM: a imagem precisaria ser gerada para essa arquitetura.

## 4. Migrations

A imagem final não tem o CLI do Prisma (o standalone só leva o client). Use o estágio `builder`, que tem o projeto e
`node_modules` (e também não leva `.env`):

```sh
docker build --target builder -t navalha-migrate:<versao> .
docker run --rm --env-file /opt/navalha/navalha.env navalha-migrate:<versao> npx prisma migrate status
docker run --rm --env-file /opt/navalha/navalha.env navalha-migrate:<versao> npx prisma migrate deploy
```

Comprovado só o `migrate status` contra o banco local ("6 migrations found ... up to date").

Produção atual (Supabase) foi criada com `db push` e não tem o histórico das migrations: antes do primeiro
`migrate deploy` é preciso comparar o schema real com a baseline (só leitura) e marcar a baseline com
`migrate resolve --applied 00000000000000_baseline`. Esse passo é **pendente de autorização** e vem depois de um
backup validado. Seed e fixture recusam banco que não seja local de propósito; criar uma barbearia nova na VPS ainda
não tem script (ver dívidas).

## 5. Proxy (Caddy ou Nginx)

- Limite de corpo de **16 MiB, configurado explicitamente** (fotos têm até 15 MB, `lib/uploads/limits.ts`). Caddy não
  limita por padrão, então não conte com o padrão: `request_body { max_size 16MiB }` no site do Navalha (no Caddy "MB"
  = 1.000.000 bytes, por isso `MiB`). Nginx: `client_max_body_size 16m;`. Mudou de 3 MB para 16 MiB em 2026-10-20 junto
  com o limite de foto (2 MB para 15 MB) e a saída das rotas de envio do matcher do middleware (`docs/uploads.md`).
  Comprovado na VPS com 3 MB (Caddy 2.10.2, `reverse_proxy` para um backend de eco, 2026-10-19): abaixo do limite passa;
  acima recebe 413, inclusive com envio chunked (sem `Content-Length`). O valor de 16 MiB precisa ser comprovado de novo.
  Atenção: o limite só age quando o corpo é lido; atrás de `file_server` um POST recebe 405 de qualquer tamanho, então
  teste sempre pela rota que faz proxy.
- Monte a **pasta** do Caddyfile no container (`./caddy:/etc/caddy:ro`), não o arquivo: editores e `sed -i` gravam um
  arquivo novo (outro inode) e um bind de arquivo único continua mostrando o antigo, sem erro nenhum (aconteceu no teste).

## 5.1 Estado da VPS (2026-10-19)

Ubuntu 24.04 x86_64, 1 vCPU, 3,8 GB RAM, 48 GB disco. Fase 2 (proteção) e fase 3 (Docker + Caddy) feitas:

- SSH só por chave (`/etc/ssh/sshd_config.d/00-navalha-hardening.conf`, lido antes dos arquivos da cloud-init).
- ufw: entrada só 22, 80, 443 (TCP) e 443/UDP. Portas publicadas por container passam por cima do ufw: só o Caddy
  publica; Postgres e app nunca publicam porta.
- fail2ban no SSH com `journalmatch = _SYSTEMD_UNIT=ssh.service` (o padrão procura `sshd.service`, que no Ubuntu 24.04
  não existe, e não bloquearia ninguém).
- Swap de 2 GB, `swappiness=10`. Logs do Docker limitados a 3 x 10 MB por container.
- `/opt/navalha`: `compose.yml` (projeto `navalha`), `caddy/Caddyfile`, `site-teste/` (página temporária em `:80`).
- Sobrevive a reinício (testado): firewall, swap, fail2ban, Docker e Caddy voltam sozinhos.
- Sem DNS apontando para a VPS ainda; HTTPS depende de um registro A (ex.: `teste.navalha.app`, DNS na Cloudflare).
- Build da imagem: no PC, enviada com `docker save | ssh ... docker load` (1 vCPU compila devagar).
- Repassar o Host original (o app escolhe a barbearia pelo Host) e preencher o cabeçalho de IP usado em
  `RATE_LIMIT_IP_HEADER`.
- Detalhe do 500 do Next em corpos grandes: `docs/uploads.md`.

## 6. Backup e restauração

Um backup só está completo com as **duas** partes, tiradas no mesmo momento:

1. Banco: `pg_dump -Fc` (formato custom, restaurável com `pg_restore`).
2. Fotos: o volume inteiro, incluindo `.navalha-uploads`:
   ```sh
   docker run --rm -v navalha_uploads:/data/uploads -v /opt/navalha/backup:/backup alpine \
     tar czf /backup/uploads-$(date +%F).tar.gz -C /data/uploads .
   ```

Restaurar o banco sem as fotos deixa URLs apontando para arquivos inexistentes: serviços caem na imagem reserva
(`getServiceImage`) e barbeiros voltam ao ícone (comprovado no `/book`), mas as fotos estão perdidas. Restaurar as
fotos sem o banco deixa arquivos órfãos (inofensivos, ocupam disco).

Um backup só conta depois de uma restauração testada num banco/volume descartável. **Ainda não testado.**

### Mudar a América de servidor

As fotos acompanham o volume: copie o `tar.gz` do volume junto com o dump, crie o volume no servidor novo e extraia
com `tar xzf ... -C /data/uploads` (mesmo comando acima, invertido). Como o marcador vai junto, não precisa rodar o init
de novo. Confira o dono uid 1001 depois de extrair (`chown -R 1001:1001` se necessário).

## 7. Dívidas conhecidas (registradas, fora deste bloco)

- **Limpeza de fotos órfãs:** não existe rotina. Sobram arquivos quando a remoção falha (vira log) ou num restore
  parcial. Proposta futura: script que lista arquivos sem URL no banco e apaga após conferência.
- **500 do Next em envio de foto:** resolvido em 2026-10-20 tirando as rotas de envio do matcher do middleware
  (`docs/uploads.md`). Acima de 15 MB o app ainda pode responder 500 em vez de 413; o proxy (16 MiB) barra o resto.
- **Um container só:** rate limit e cache de tenant ficam em memória; com 2 réplicas cada uma conta separado.
- **Provisionar barbearia em banco remoto:** sem script seguro ainda.
- **Cron de lembretes** (`scripts/cron.ts`) não está no container; WhatsApp só na barbearia padrão (Blocos 6/7).
- **Sem health check, monitor de queda e CI.**
