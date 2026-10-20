# Navalha.app

Plataforma de gestão para barbearias: agenda, agendamento online, clientes, serviços, produtos, financeiro, metas
e notificações por WhatsApp. Construída como um monólito Next.js preparado para atender várias barbearias
(multi-tenant), cada uma isolada pelo seu endereço.

> **Status:** em desenvolvimento, uso privado. A barbearia América opera hoje na versão anterior (branch `main`).
> A versão multi-tenant (blocos 0 a 4) está validada localmente e em preparação para a VPS. Veja
> [docs/roadmap.md](docs/roadmap.md).

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Início rápido](#início-rápido)
- [Comandos](#comandos)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Segurança](#segurança)

## Visão geral

| Módulo | O que faz |
|---|---|
| Agenda | Agendamentos com vários serviços, conflito de horário verificado em transação serializável |
| Agendamento online (`/book`) | Página pública da barbearia: serviço, barbeiro, data e horário, dados do cliente |
| Clientes | Cadastro, histórico e próximo atendimento |
| Financeiro | Receitas, despesas, categorias, relatórios e alertas |
| Metas | Metas de faturamento por período |
| Equipe | Barbeiros e administradores, com desativação no lugar de exclusão |
| Fotos | Foto de serviço e de barbeiro, convertida para WebP e sem metadados (EXIF/GPS) |
| Notificações | WhatsApp via Evolution API e eventos para n8n (em evolução) |

Princípios que orientam o projeto (detalhes em [AGENTS.md](AGENTS.md)):

- **Isolamento entre barbearias** em toda consulta, comprovado por suíte automatizada.
- **Evidência antes de afirmar:** nada é dado como pronto sem teste que comprove.
- **Mudanças incrementais** em blocos com critério de aceite, sem refatoração fora do escopo.

## Stack

| Camada | Tecnologia |
|---|---|
| Aplicação | Next.js 15.5 (App Router, middleware em Node.js), React 19, TypeScript |
| Dados | PostgreSQL, Prisma 6.19 (migrations versionadas) |
| Interface | Tailwind CSS 4, Radix UI, React Hook Form, Zod, SWR, Recharts |
| Sessão | JWT HS256 (`jose`) em cookie `httpOnly`, preso ao endereço da barbearia |
| Imagens | sharp (WebP, até 800 px) |
| Integrações | Evolution API (WhatsApp), n8n (eventos) |
| Infraestrutura | Docker, Caddy (HTTPS), VPS Ubuntu 24.04 |

## Início rápido

Requisitos: Node.js 20+, npm e Docker (para o PostgreSQL local).

```bash
npm install
cp .env.example .env          # aponta para o banco LOCAL (porta 5440); defina JWT_SECRET e SEED_ADMIN_PASSWORD
docker compose up -d db       # PostgreSQL 15 local
npx prisma migrate deploy     # aplica as migrations
npm run db:seed               # dados iniciais (recusa banco que não seja local)
npm run uploads:init          # pasta das fotos
npm run dev
```

Acesse **http://america.localhost:3000** (cada barbearia responde no seu subdomínio; `localhost:3000` puro dá 404
de propósito). O passo a passo completo, com variáveis e problemas comuns, está em
[docs/development.md](docs/development.md).

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e execução |
| `npx tsc --noEmit` | Checagem de tipos (**obrigatória**: o build ignora erros de tipo) |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (sem servidor) |
| `npm run test:fixture` | Dados de teste da barbearia B (banco local) |
| `npm run test:isolation` | Isolamento entre barbearias contra um servidor real |
| `npm run test:uploads` | Fotos ponta a ponta contra um servidor real |
| `npm run db:migrate` / `db:reset` / `db:push` | Banco local (recusam banco remoto) |
| `npm run cron` | Lembretes por WhatsApp (processo separado) |

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice da documentação |
| [docs/architecture.md](docs/architecture.md) | Arquitetura, multi-tenant, sessão, fuso, fotos, notificações |
| [docs/development.md](docs/development.md) | Ambiente local, variáveis, banco, fluxo de trabalho |
| [docs/testing.md](docs/testing.md) | Estratégia e suítes de teste |
| [docs/security.md](docs/security.md) | Modelo de segurança e como reportar problemas |
| [docs/deploy.md](docs/deploy.md) | Deploy em VPS com Docker, backup e estado do servidor |
| [docs/uploads.md](docs/uploads.md) | Fotos: limites, armazenamento, volume |
| [docs/roadmap.md](docs/roadmap.md) | Status por bloco, dívidas conhecidas e próximos passos |
| [docs/decisions/](docs/decisions/README.md) | Registros de decisão de arquitetura (ADRs) |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |

## Contribuição

1. Crie uma branch a partir da branch de integração (`feat/<assunto>` ou `fix/<assunto>`). Nunca commite na `main`.
2. Antes do commit: `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build`.
3. Mudanças em rotas da API: rode `test:fixture` + `test:isolation` (a suíte falha se houver rota nova sem teste).
4. Commits no formato `tipo(escopo): descrição` (ex.: `feat(bloco-4c): foto do barbeiro`).
5. Adicione arquivos pelo nome (`git add <arquivo>`), não `git add .`.

## Segurança

Nunca versione `.env`, chaves ou dumps de banco. Comandos que gravam dados recusam rodar contra banco remoto.
Modelo completo e como reportar uma falha: [docs/security.md](docs/security.md).

## Licença

Uso privado e restrito ao projeto Navalha.app. Consulte os proprietários antes de redistribuir ou publicar.
