# Arquitetura

Versão do documento: 2026-10-19. Descreve o **estado atual** do código. O que ainda é plano está marcado como
**destino** e não existe no código.

## 1. Visão geral

```text
                Internet
                    |
        +-----------v-----------+
        |  Caddy (HTTPS, 80/443) |  limite de corpo 16 MiB, X-Real-IP, sem cabeçalhos de versão
        +-----------+-----------+
                    | Host original
        +-----------v-----------+
        |  Next.js (monólito)    |
        |  middleware (Node.js)  |  barbearia pelo Host, sessão, 404/401
        |  páginas + /api        |  requireTenantUser/Admin em cada rota
        +-----+-----------+-----+
              |           |
     +--------v--+   +----v-----------------+
     | PostgreSQL |   | volume /data/uploads |  fotos WebP por barbearia
     | (Prisma)   |   +----------------------+
     +------------+
              ^
     +--------+---------+        +-----------------+
     | scripts/cron.ts  | -----> | Evolution API   |  WhatsApp (só a barbearia padrão)
     | lembretes (5 min)|        +-----------------+
     +------------------+        +-----------------+
       lib/notifications.ts ---> | n8n (webhook)   |  eventos, opcional
                                 +-----------------+
```

Um único processo Next.js atende todas as barbearias. Não há microsserviços, filas ou cache externo (decisão
consciente: [AGENTS.md](../AGENTS.md), seção "Regra Contra Overengineering").

## 2. Multi-tenant (barbearias)

| Aspecto | Implementação |
|---|---|
| Modelo de dados | Banco único; toda tabela operacional tem `barbeariaId` ([ADR-0001](decisions/0001-banco-unico-barbeariaid.md)) |
| Descoberta da barbearia | Pelo Host: `<subdominio>.TENANT_ROOT_DOMAIN` ou `Barbearia.customDomain` ([ADR-0002](decisions/0002-barbearia-pelo-host.md)) |
| Host desconhecido, inativo ou reservado | 404 (nunca cai numa barbearia padrão) |
| Subdomínios reservados | `www, app, api, admin, painel, login, static, mail` (CHECK no banco + código) |
| Cache | Em memória, 30 s por processo (`lib/tenant.ts`) |
| Leitura e escrita | Toda consulta filtra `barbeariaId`; `update/delete` usam `where { id, barbeariaId }` |
| Id de outra barbearia | 404, igual a id inexistente (nunca 403, para não confirmar que o registro existe) |
| Referências cruzadas | Cliente, serviço, barbeiro e categoria são validados na mesma barbearia |

Arquivos: `lib/tenant-host.ts` (funções puras), `lib/tenant.ts` (banco + cache), `lib/api.ts`
(`requireTenantUser`, `requireTenantAdmin`, `requireTenant`, `tenantErrorResponse`), `middleware.ts`.

**Limite atual:** identidade visual, contatos, endereço e mapa vêm de `config/tenant.ts`, que é único. Os dados são
isolados, mas uma segunda barbearia real ainda veria textos da América na landing e no `/book`
(ver [roadmap](roadmap.md)).

## 3. Autenticação e sessão

| Item | Valor |
|---|---|
| Token | JWT HS256 (`jose`), `JWT_SECRET` obrigatório, sem valor padrão |
| Claims | `userId`, `role`, `barbeariaId`, `sessionStart` |
| Cookie | `barberos_session`, `httpOnly`, `secure` em produção, `sameSite=lax`, **sem `Domain`** (preso ao endereço) |
| Expiração | 2 h de inatividade (renovada pelo middleware); 8 h no máximo desde o login |
| Barbearia errada | Token de outra barbearia é descartado; login só vale na barbearia do usuário |
| Usuário inativo | Login recusado; sessão existente deixa de valer |
| Respostas | Páginas: redirecionamento ao login. API: JSON 401/403, sem redirecionamento |
| Login | Mensagem genérica; hash fictício quando o e-mail não existe (tempo de resposta igual) |

Papéis: `ADMIN` (tudo na sua barbearia) e `BARBER` (agenda). As rotas revalidam a sessão no handler; o middleware não
é a única barreira.

## 4. Agendamento

- Um agendamento tem um ou mais serviços (`AppointmentService`); duração e valor são a soma.
- Criação no painel (`/api/appointments`) e na página pública (`/api/book`) roda em **transação serializável**
  (`Prisma.TransactionIsolationLevel.Serializable`): dois clientes não ficam com o mesmo horário.
- Página pública: limite de 10 reservas por IP/hora e 3 por telefone/dia por barbearia.

## 5. Fuso horário

Cada barbearia tem `timezone` IANA (América: `America/Porto_Velho`) ([ADR-0003](decisions/0003-fuso-da-barbearia.md)).
O servidor roda em UTC; dias, semanas e meses de relatórios, metas e painel são calculados no fuso da barbearia
(`lib/time-zone.ts`). As telas recebem o fuso por `/api/auth/me` e formatam datas nele, não no fuso do aparelho.
Formulários enviam horário de parede (`yyyy-MM-ddTHH:mm`, sem `Z`).

## 6. Fotos

Upload pelo admin, convertido para WebP (lado maior até 800 px, sem EXIF/GPS) e gravado no disco em
`<UPLOADS_DIR>/<barbeariaId>/<services|avatars>/<uuid>.webp`. Leitura pública em `/media/...`, entregue só no Host da
barbearia dona. Detalhes: [uploads.md](uploads.md), [ADR-0004](decisions/0004-fotos-em-disco-na-vps.md).

## 7. Notificações e eventos

| Peça | Estado atual |
|---|---|
| `lib/notifications.ts` | Disparada após criar agendamento, em segundo plano (falha só gera log, não afeta a reserva) |
| `lib/whatsapp.ts` | Evolution API, instância fixa `barberos_main`; rotas de WhatsApp só na barbearia padrão |
| `scripts/cron.ts` | Processo separado (`npm run cron`), verifica lembretes a cada 5 minutos; fora do Docker |
| `lib/events.ts` | Webhook n8n opcional (`N8N_WEBHOOK_URL`); sem a variável, o evento é ignorado com aviso |

**Destino** (Blocos 6 e 7, ainda não implementado): o Navalha registra fatos de negócio (`appointment.created`, etc.)
com `barbeariaId`, e o n8n orquestra as mensagens; WhatsApp por barbearia, com idempotência.

## 8. Dados

Schema em `prisma/schema.prisma`; histórico em `prisma/migrations/` (baseline + migrations dos blocos). Toda mudança de
banco é feita por migration versionada; `db push` só em banco local. Entidades principais: `Barbearia`, `User`,
`Client`, `Service`, `Appointment`, `AppointmentService`, `Transaction`, `Category`, `Goal`, `Product`,
`FinanceAlert`.

## 9. Infraestrutura

Produção alvo: VPS com Docker (app, PostgreSQL e Caddy em `compose`), fotos em volume nomeado, segredos em arquivos
de ambiente fora do Git ([ADR-0005](decisions/0005-deploy-vps-docker.md)). Passo a passo e estado atual do servidor:
[deploy.md](deploy.md).
