# Navalha.app

Sistema de gestao para barbearias, com agenda, clientes, servicos, produtos,
financeiro e comunicacao automatizada por WhatsApp.

> Projeto privado em desenvolvimento. Consulte a equipe antes de usar em
> producao.

## Visao geral

O Navalha.app centraliza a operacao diaria da barbearia em um painel
responsivo:

- Agenda diaria com filtros por data e status
- Cadastro de clientes com telefone normalizado para o Brasil
- Servicos, produtos e controle de estoque
- Dashboard com indicadores, metas e receitas
- Financeiro com entradas, despesas, categorias e relatorios
- Usuarios e permissoes para barbeiros e administradores
- Confirmacoes e lembretes de agendamento via WhatsApp
- Interface responsiva com tema premium e carregamentos skeleton

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

## Visao geral da estrategia de ramificacao (Gitflow)

O fluxo de trabalho e coordenado pela natureza da tarefa. O agente Lead /
Maestro classifica a demanda e direciona o trabalho para o agente responsavel,
sempre mantendo o codigo isolado ate que as validacoes sejam concluidas.

### Papeis no fluxo de trabalho

| Papel no fluxo | Responsabilidade |
| --- | --- |
| **Coordenador do fluxo (Lead / Maestro)** | Classifica a demanda como Funcionalidade, Release ou Hotfix e define a origem e o destino do merge. |
| **Desenvolvedor de funcionalidades (Feature Developer)** | Desenvolve novas funcionalidades a partir de `develop` e abre o Pull Request de volta para `develop`. |
| **Responsavel pela release (Release Manager)** | Congela novas adicoes, executa a regressao, incrementa a versao e prepara os merges de producao. |
| **Responsavel por emergencias (Emergency Handler)** | Corrige falhas criticas a partir de `main` e sincroniza a correcao com `main` e `develop`. |

### Matriz de decisao

| Tipo de tarefa | Branch de origem | Destino final | Tag de versao |
| --- | --- | --- | --- |
| **Funcionalidade (Feature)** | `develop` | `develop` | Nao |
| **Release** (preparacao de versao) | `develop` | `main` e `develop` | Sim, por exemplo `v1.2.0` |
| **Hotfix** (correcao emergencial) | `main` | `main` e `develop` | Sim, por exemplo `v1.2.1` |

### Fluxo de Funcionalidade (Feature)

1. O Coordenador do fluxo classifica a demanda como uma nova funcionalidade.
2. O Desenvolvedor de funcionalidades cria a branch a partir de `develop`:

   ```bash
   git switch develop
   git pull --ff-only origin develop
   git switch -c feature/nome-da-feature
   ```

3. O desenvolvedor implementa a funcionalidade, executa os testes unitarios e de
   integracao e abre um Pull Request para `develop`.
4. A branch e integrada em `develop` somente apos a revisao e a aprovacao das
   validacoes automaticas.

### Fluxo de Release (preparacao de versao)

1. O Coordenador do fluxo identifica que o conjunto de alteracoes esta pronto para
   homologacao.
2. O Responsavel pela release cria a branch a partir de `develop`, usando a proxima
   versao semver:

   ```bash
   git switch develop
   git pull --ff-only origin develop
   git switch -c release/vX.Y.Z
   ```

3. A branch de release recebe apenas ajustes de estabilizacao. O agente executa
   a regressao completa e valida o pacote em homologacao.
4. Apos a aprovacao, o Responsavel pela release faz merge duplo:
   - `release/vX.Y.Z` para `main`, criando a tag `vX.Y.Z`;
   - `release/vX.Y.Z` de volta para `develop`, preservando os ajustes de
     estabilizacao.

### Fluxo de Hotfix (correcao emergencial)

1. O Coordenador do fluxo classifica a falha como critica e que exige correcao
   emergencial em producao.
2. O Responsavel por emergencias cria a branch a partir de `main`:

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c hotfix/nome-da-correcao
   ```

3. O agente implementa a menor correcao segura, executa os testes unitarios e
   de integracao e valida o comportamento em producao.
4. Apos a aprovacao, o Responsavel por emergencias faz merge duplo:
   - `hotfix/nome-da-correcao` para `main`, criando ou atualizando a tag de
     versao (por exemplo, `v1.2.1`);
   - `hotfix/nome-da-correcao` para `develop`, evitando que a falha volte a
     aparecer na proxima release.

### Validacao obrigatoria

Antes de qualquer merge, o agente responsavel deve executar no ambiente
isolado:

```bash
npx tsc --noEmit
npm run lint
```

Quando houver testes unitarios ou de integracao configurados para a alteracao,
eles tambem devem ser executados e aprovados antes da abertura ou aprovacao do
Pull Request. Evite usar `git add .` quando houver alteracoes de outras tarefas
no mesmo diretorio.

## Seguranca

- Nao compartilhe credenciais, tokens ou arquivos `.env`.
- Valide entradas no frontend e na API.
- Use HTTPS e variaveis protegidas no ambiente de producao.
- Revise os logs de integracoes externas antes de publicar.

## Direitos autorais e termos de uso

Copyright (c) 2026 DOUGLASWEB-DG. Todos os direitos reservados.

Este repositorio e publico para consulta, aprendizado e colaboracao no
desenvolvimento do projeto. A disponibilizacao publica do codigo nao concede
licenca para vender, sublicenciar, redistribuir, hospedar como servico,
incorporar em produto comercial ou explorar financeiramente qualquer parte
deste projeto sem autorizacao previa e escrita dos detentores dos direitos.

Contribuicoes para melhorar o projeto sao bem-vindas por Pull Request. Ao
enviar uma contribuicao, o autor confirma que possui os direitos necessarios
para envia-la e autoriza sua incorporacao ao projeto. A contribuicao nao
transfere automaticamente a titularidade do projeto nem concede permissao de
exploracao comercial a terceiros.

Consulte [LICENSE](LICENSE) para os termos completos. Esta declaracao nao
substitui aconselhamento juridico.
