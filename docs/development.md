# Desenvolvimento local

## 1. Requisitos

- Node.js 20 ou superior e npm
- Docker (PostgreSQL local em `docker-compose.yml`, porta **5440**)
- Windows, macOS ou Linux. No Windows, os scripts de teste usam `127.0.0.1` com o cabeçalho `Host`, porque o Node não
  resolve `*.localhost`; o navegador resolve normalmente.

## 2. Primeira execução

```bash
npm install
cp .env.example .env
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
npm run uploads:init
npm run dev
```

Abra **http://america.localhost:3000**. `localhost:3000` sem subdomínio é o domínio raiz e responde 404 de propósito.

## 3. Variáveis de ambiente

Referência completa e comentada: [`.env.example`](../.env.example). O `.env` nunca vai para o Git.

| Variável | Local | Observação |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | banco do `docker-compose.yml` | **Só banco local.** Os comandos que gravam recusam outro host |
| `JWT_SECRET` | qualquer valor aleatório com 32+ caracteres | Obrigatório; sem padrão no código |
| `SEED_ADMIN_PASSWORD` | 12+ caracteres | Senha do admin criado pelo seed (`admin@administrador.com`) |
| `TENANT_ROOT_DOMAIN` | vazio (vale `localhost`) | Produção: `navalhaapp.tech` |
| `UPLOADS_DIR` | `./.uploads` | Pasta das fotos (fora do Git) |
| `RATE_LIMIT_IP_HEADER` | vazio | Só com proxy que sobrescreve o cabeçalho |
| `NEXT_PUBLIC_EVO_URL`, `EVO_API_KEY` | vazio ou endereço inválido | Sem eles nenhuma mensagem sai da máquina |
| `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` | vazio | Sem a URL, eventos são ignorados com aviso |

## 4. Banco de dados

| Situação | Comando |
|---|---|
| Aplicar migrations existentes | `npx prisma migrate deploy` |
| Criar migration nova (após editar o schema) | `npm run db:migrate` |
| Recriar o banco local do zero | `npm run db:reset` |
| Inspecionar dados | `npm run db:studio` |

**Proteção:** `db:migrate`, `db:reset`, `db:push`, `db:seed`, a fixture e as suítes de integração passam por
`scripts/local-db-guard.ts` e recusam rodar se `DATABASE_URL`/`DIRECT_URL` não apontarem para `localhost`. Não remova
essa proteção; produção recebe migrations só pelo procedimento de [deploy.md](deploy.md).

Observação: o Prisma CLI lê apenas `.env` (não `.env.local`).

## 5. Fluxo de trabalho

1. Branch a partir da branch de integração: `feat/<assunto>` ou `fix/<assunto>`. A `main` não recebe commits diretos.
2. Desenvolva em fases pequenas, com critério de aceite definido antes.
3. Antes de cada commit, o gate:
   ```bash
   npx tsc --noEmit     # o build NÃO falha por erro de tipo (ignoreBuildErrors), por isso é obrigatório
   npm run lint
   npm test
   npm run build
   ```
4. Mudou rota da API ou consulta ao banco: rode as suítes de integração ([testing.md](testing.md)).
5. Commit: `tipo(escopo): descrição` em português, adicionando arquivos pelo nome.

## 6. Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| 404 em `localhost:3000` | Use `america.localhost:3000` |
| 404 em `america.localhost:3000` | `TENANT_ROOT_DOMAIN` definido como `navalhaapp.tech` no `.env`: deixe vazio |
| Login funciona no `next dev` mas não no `next start` local | Em produção o cookie é `Secure` e o navegador não o guarda em HTTP |
| Foto: "UPLOADS_DIR não configurada" ou "volume não montado" (503) | Defina `UPLOADS_DIR` e rode `npm run uploads:init` |
| `EPERM` no build (Windows) | Um `next dev` está segurando a DLL do Prisma: pare o servidor e repita |
| Comando de banco "recusado" | A proteção viu um banco não local no `.env`: corrija a URL |
