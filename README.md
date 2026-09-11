# Navalha.app

Sistema de gestao para barbearias que centraliza agenda, clientes, operacao,
financeiro e relacionamento com os clientes em um unico lugar.

> Projeto privado em desenvolvimento. Consulte a equipe antes de usar em
> producao.

## O problema que o Navalha.app resolve

Barbearias que controlam agendamentos, clientes, estoque e caixa em planilhas,
anotacoes ou ferramentas separadas perdem tempo, ficam sujeitas a erros e tem
dificuldade para acompanhar o desempenho do negocio. A falta de confirmacoes
automaticas tambem aumenta as chances de faltas e deixa o atendimento mais
reativo.

O Navalha.app resolve esse problema ao reunir a rotina da barbearia em um
painel responsivo, com informacoes organizadas e automacoes que ajudam a equipe
a atender melhor, reduzir faltas e tomar decisoes com base nos dados.

## Principais funcionalidades

### Organizar a agenda e o atendimento

- Agenda diaria com filtros por data e status.
- Confirmacoes e lembretes de agendamento via WhatsApp.
- Cadastro de clientes com telefone normalizado para o Brasil.
- Interface responsiva, com tema premium e carregamentos skeleton.

### Controlar a operacao

- Cadastro de servicos e produtos.
- Controle de estoque.
- Usuarios e permissoes para barbeiros e administradores.

### Acompanhar resultados e o financeiro

- Dashboard com indicadores, metas e receitas.
- Controle financeiro com entradas, despesas e categorias.
- Relatorios para acompanhar a saude do negocio.

## Beneficios para a barbearia

- **Mais organizacao:** toda a operacao diaria fica centralizada em um unico
  sistema.
- **Menos faltas:** clientes recebem confirmacoes e lembretes pelo WhatsApp.
- **Mais controle:** estoque, caixa, servicos e equipe podem ser acompanhados
  no mesmo ambiente.
- **Decisoes melhores:** indicadores, metas e relatorios tornam os resultados
  mais visiveis.
- **Melhor experiencia:** equipe e clientes contam com uma interface rapida,
  responsiva e consistente.

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
