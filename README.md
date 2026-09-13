# Navalha.app

Sistema de gestao para barbearias, com agenda, clientes, servicos, produtos,
financeiro e comunicacao automatizada por WhatsApp.

> Projeto privado em desenvolvimento. Consulte a equipe antes de usar em
> producao.

## Visao geral

# Estado atual do projeto

## Navalha.app

Este documento registra o estado técnico atual do projeto,
os principais riscos conhecidos e os próximos pontos de evolução.

O objetivo não é apenas registrar funcionalidades,
mas acompanhar a evolução da qualidade técnica do sistema.

---

## Matriz de projeto

| Área | Estado | Observação |
|---|---|---|
| Stack | 🟢 Muito boa | Base tecnológica adequada |
| Estrutura | 🟢 Boa | Organização inicial consistente |
| Banco/modelagem | 🟡 Precisa evolução | Existem decisões de domínio a consolidar |
| Agendamento | 🔴 Crítico | Principal ponto técnico atual |
| UI/Design System | 🟡 Boa base | Precisa padronização |
| Responsividade | 🔴 Atenção | Componentes compartilhados apresentam problemas mobile |
| Segurança/RBAC | 🟡 Funciona | Precisa maior centralização e endurecimento |
| Testes | 🔴 Precisa evoluir | Cobertura insuficiente |
| CI/CD | 🔴 Precisa estruturar | Pipeline ainda não consolidado |
| Observabilidade | 🔴 Praticamente ausente | Falta estratégia de logs e monitoramento |
| Documentação | 🟡 Boa base | Precisa organização técnica |
| SaaS real | 🔴 Ainda não | Multi-tenant e billing ainda não implementados |

---

# Prioridade atual

Agendamento.

A evolução deve seguir:

1. Entendimento do fluxo de agendamento público
2. Estabilização dos componentes compartilhados de UI
3. Consolidação de Appointment + AppointmentService
4. Adaptação das APIs
5. Adaptação da agenda
6. Adaptação do financeiro
7. Adaptação das notificações/WhatsApp
8. Validação de conflitos de horário
9. Testes desktop/mobile
10. Testes automatizados
11. Versionamento

---

# Critério de evolução

Funcionalidades

Ela deve considerar:

- domínio
- banco de dados
- API
- interface
- validação
- segurança
- responsividade
- testes
- documentação
- deploy

---

# Próximo marco

## Multi-serviço por agendamento

Permitir que um cliente tenha vários serviços dentro do
mesmo agendamento.

Exemplo:

Cliente:
João

Agendamento:
14:00

Serviços:
- Corte
- Barba
- Sobrancelha

O sistema deve calcular corretamente:

- duração total
- valor total
- disponibilidade do barbeiro
- agenda
- financeiro
- notificações

## Stack

- **Frontend e backend:** Next.js 15, React 19 e TypeScript
- **Estilos:** Tailwind CSS, Radix UI e componentes reutilizaveis
- **Persistencia:** PostgreSQL com Prisma ORM
- **Formularios e validacao:** React Hook Form e Zod
- **Graficos:** Recharts
- **WhatsApp:** Evolution API
- **Automacoes:** Node.js, `tsx` e cron

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL (Supabase ou servidor proprio)
- Docker e Docker Compose, caso use os servicos locais definidos em
  `docker-compose.yml`

## Configuracao local

### 1. Clone o repositorio

```bash
git clone https://github.com/DOUGLASWEB-DG/Barbeiro-Atual.git
cd Barbeiro-Atual
```

### 2. Instale as dependencias

```bash
npm install
```

### 3. Configure as variaveis de ambiente

Copie `.env.example` para `.env` e preencha as credenciais do PostgreSQL:

```bash
cp .env.example .env
```

Variaveis obrigatorias:

| Variavel | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexao principal com pool de conexoes |
| `DIRECT_URL` | Conexao direta usada pelo Prisma em migracoes |

Nunca envie o arquivo `.env` para o Git.

### 4. Prepare o banco

```bash
npm run db:push
npm run db:seed
```

### 5. Inicie o sistema

Terminal 1 - aplicacao web:

```bash
npm run dev
```

Terminal 2 - lembretes automaticos:

```bash
npm run cron
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponiveis

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia o Next.js em desenvolvimento |
| `npm run build` | Gera o Prisma Client, atualiza o banco e cria o build |
| `npm run start` | Inicia a aplicacao compilada |
| `npm run lint` | Executa o ESLint do projeto |
| `npm run format` | Formata os arquivos com Prettier |
| `npm run cron` | Executa o processo de lembretes do WhatsApp |
| `npm run db:push` | Sincroniza o schema Prisma com o banco |
| `npm run db:migrate` | Cria e executa uma migracao Prisma |
| `npm run db:seed` | Carrega dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Reseta o banco de desenvolvimento |

## Estrutura principal

```text
app/
  api/                 Rotas da API
  dashboard/           Telas administrativas
  book/                Fluxo publico de agendamento
components/            Componentes compartilhados
config/                Configuracoes da barbearia
lib/                   Autenticacao, formatacao e integracoes
prisma/                Schema e seed do banco
public/                Imagens e assets publicos
scripts/               Jobs e automacoes
```

## Configuracoes da barbearia

Dados institucionais, como nome, identidade e informacoes de contato, ficam
centralizados em [config/tenant.ts](config/tenant.ts). Ajuste esse arquivo
conforme a identidade da sua unidade.

## Qualidade e validacao

Antes de abrir um Pull Request, execute:

```bash
npx tsc --noEmit
npm run lint
```

Para testar uma alteracao visual, valide o dashboard em desktop e celular,
principalmente as telas de Agenda, Clientes e Agendamentos.

## Fluxo Git recomendado

```bash
git checkout -b minha-alteracao
git status
git add arquivo1 arquivo2
git commit -m "Descreve a alteracao"
git push -u origin minha-alteracao
```

Depois, abra um Pull Request para `main`. Evite usar `git add .` quando houver
alteracoes de outras tarefas no mesmo diretorio.

## Seguranca

- Nao compartilhe credenciais, tokens ou arquivos `.env`.
- Valide entradas no frontend e na API.
- Use HTTPS e variaveis protegidas no ambiente de producao.
- Revise os logs de integracoes externas antes de publicar.

## Licenca

Uso privado e restrito ao projeto Navalha.app. Consulte os proprietarios antes
de redistribuir ou publicar este codigo.
