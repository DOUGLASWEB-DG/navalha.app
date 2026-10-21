# Navalha.app

Plataforma de gestão para barbearias: agenda, agendamento online, clientes, serviços, produtos, financeiro, metas e
notificações por WhatsApp. Um monólito Next.js preparado para atender várias barbearias (multi-tenant), cada uma
isolada pelo seu endereço.

> **Status (2026-10-21):** em desenvolvimento, uso privado.
> - **Produção atual:** a barbearia América opera na versão anterior (branch `main`, banco no Supabase).
> - **Nova versão:** branch `feat/ui-icones-tipografia`, publicada na VPS em `america.navalhaapp.tech` com **banco de
>   teste** (implantação na fase 4 de 7). Os dados reais ainda não foram migrados.
>
> Detalhes em [docs/roadmap.md](docs/roadmap.md).

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura em resumo](#arquitetura-em-resumo)
- [Stack](#stack)
- [Ambientes](#ambientes)
- [Início rápido](#início-rápido)
- [Comandos](#comandos)
- [Qualidade e testes](#qualidade-e-testes)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Segurança](#segurança)
- [Licença](#licença)

## Funcionalidades

| Módulo | O que faz |
|---|---|
| Agenda | Agendamentos com vários serviços por atendimento; conflito de horário verificado em transação serializável |
| Agendamento online (`/book`) | Página pública da barbearia: serviço, barbeiro, data, horário e dados do cliente |
| Clientes | Cadastro, histórico e próximo atendimento |
| Financeiro | Receitas, despesas, categorias, relatórios, exportação CSV e alertas |
| Metas | Metas de faturamento por período |
| Produtos e serviços | Catálogo com preço, duração, foto e estoque (sem estoque, estoque baixo, em estoque) |
| Equipe | Barbeiros e administradores; desativação no lugar de exclusão |
| Fotos | Foto de serviço e de barbeiro até 15 MB, guardada em WebP de até 800 px, sem metadados (EXIF/GPS) |
| Notificações | WhatsApp via Evolution API: agendamento recebido, confirmação, atendimento concluído e lembrete |
| Multi-tenant | Cada barbearia no seu endereço (`<barbearia>.navalhaapp.tech` ou domínio próprio), dados isolados |

## Arquitetura em resumo

```text
Internet ──> Caddy (HTTPS, limite de corpo 16 MiB)
               │  repassa o Host original
               v
           Next.js (App Router)
             ├─ middleware: identifica a barbearia pelo Host, valida a sessão
             ├─ rotas /api: revalidam sessão e barbearia em toda chamada (nunca confiam só no middleware)
             └─ Prisma ──> PostgreSQL (um banco; barbeariaId em toda tabela operacional)
           Evolution API (WhatsApp), só na rede interna
           Volume de fotos (/data/uploads/<barbeariaId>/...)
```

Princípios (detalhes em [AGENTS.md](AGENTS.md)):

- **Isolamento entre barbearias** em toda consulta, comprovado por suíte automatizada que falha se surgir rota nova
  sem teste.
- **Evidência antes de afirmar:** nada é dado como pronto sem teste que comprove; o que não foi testado é declarado.
- **Mudanças incrementais** em blocos com critério de aceite, sem refatoração fora do escopo.

Decisões de arquitetura registradas em [docs/decisions/](docs/decisions/README.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Aplicação | Next.js 15.5 (App Router, middleware em Node.js), React 19.2, TypeScript 5.9 |
| Dados | PostgreSQL 17 (VPS) / 15 (local), Prisma 6.19 com migrations versionadas |
| Interface | Tailwind CSS 4.2, Radix UI, React Hook Form, Zod, SWR, Recharts, Sonner |
| Sessão | JWT HS256 (`jose`) em cookie `httpOnly`, preso ao endereço da barbearia |
| Imagens | sharp 0.34 (WebP, até 800 px) |
| Integrações | Evolution API 2.3.7 (WhatsApp); eventos para n8n em evolução |
| Infraestrutura | Docker, Caddy 2.10 (HTTPS automático), VPS Ubuntu 24.04 |

## Ambientes

| Ambiente | Endereço | Banco | Observação |
|---|---|---|---|
| Local | `http://america.localhost:3000` | PostgreSQL em Docker (porta 5440) | `localhost:3000` puro responde 404 de propósito |
| VPS (teste) | `https://america.navalhaapp.tech` | PostgreSQL 17 em Docker, dados de teste | `navalhaapp.tech` redireciona para a América |
| Produção atual | versão anterior (`main`) | Supabase | Até a migração dos dados (fase 6) |

## Início rápido

Requisitos: Node.js 20+, npm e Docker (para o PostgreSQL local).

```bash
npm install
cp .env.example .env          # banco LOCAL (porta 5440); defina JWT_SECRET e SEED_ADMIN_PASSWORD
docker compose up -d db       # PostgreSQL local
npx prisma migrate deploy     # aplica as migrations
npm run db:seed               # dados iniciais (recusa banco que não seja local)
npm run uploads:init          # pasta das fotos
npm run dev
```

Acesse **http://america.localhost:3000**. Variáveis, banco e problemas comuns: [docs/development.md](docs/development.md).

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e execução |
| `npx tsc --noEmit` | Checagem de tipos (**obrigatória**: o build ignora erros de tipo) |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (sem servidor) |
| `npm run test:fixture` | Dados de teste da barbearia B (somente banco local) |
| `npm run test:isolation` | Isolamento entre barbearias contra um servidor real |
| `npm run test:uploads` | Fotos ponta a ponta contra um servidor real |
| `npm run db:migrate` / `db:reset` / `db:push` | Banco local (recusam banco remoto) |
| `npm run cron` | Lembretes por WhatsApp (processo separado) |

## Qualidade e testes

| Verificação | Cobertura |
|---|---|
| Testes unitários (`npm test`) | 42 testes: fuso horário, barbearia pelo Host, consultas por barbearia, fotos, mensagens de erro, nomes de serviço |
| Isolamento (`test:isolation`) | 119 verificações em 46 rotas e métodos; cobertura obrigatória de rotas |
| Fotos (`test:uploads`) | 99 verificações, incluindo fotos de 10 MB e de 50 MP |
| Gate de cada entrega | `tsc`, lint, testes, build e teste funcional no navegador (computador e celular) |

Estratégia e lacunas conhecidas: [docs/testing.md](docs/testing.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice da documentação |
| [docs/architecture.md](docs/architecture.md) | Arquitetura, multi-tenant, sessão, fuso, fotos, notificações |
| [docs/development.md](docs/development.md) | Ambiente local, variáveis, banco, fluxo de trabalho |
| [docs/testing.md](docs/testing.md) | Estratégia e suítes de teste |
| [docs/security.md](docs/security.md) | Modelo de segurança e como reportar problemas |
| [docs/deploy.md](docs/deploy.md) | Deploy na VPS com Docker, WhatsApp, backup e estado do servidor |
| [docs/uploads.md](docs/uploads.md) | Fotos: limites, armazenamento, volume |
| [docs/roadmap.md](docs/roadmap.md) | Status, fases da VPS, dívidas conhecidas |
| [docs/decisions/](docs/decisions/README.md) | Registros de decisão de arquitetura (ADRs) |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |

## Contribuição

1. Crie uma branch a partir da branch de integração (`feat/<assunto>` ou `fix/<assunto>`). Nunca commite na `main`.
2. Antes do commit: `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build`.
3. Mudou rota da API: rode `test:fixture` e `test:isolation` (a suíte falha se houver rota nova sem teste).
4. Mudou tela: confira no navegador, no computador e no celular.
5. Commits no formato `tipo(escopo): descrição` (ex.: `feat(ui-1): cores com significado nas confirmações`).
6. Adicione arquivos pelo nome (`git add <arquivo>`), não `git add .`.

## Segurança

Nunca versione `.env`, chaves ou dumps de banco. Comandos que gravam dados recusam rodar contra banco remoto. Em
produção, segredos ficam só no servidor, em arquivos com permissão 600. Modelo completo e como reportar uma falha:
[docs/security.md](docs/security.md).

## Licença

Uso privado e restrito ao projeto Navalha.app. Consulte os proprietários antes de redistribuir ou publicar.
