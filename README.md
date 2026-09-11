# Navalha.app

Sistema de gestão para barbearias que centraliza agenda, clientes, operação,
financeiro e relacionamento com os clientes em um único lugar.

> **Projeto privado em desenvolvimento.** Consulte a equipe antes de usar em
> produção.

## O problema que o Navalha.app resolve

Barbearias que controlam agendamentos, clientes, estoque e caixa em planilhas,
anotações ou ferramentas separadas perdem tempo, ficam sujeitas a erros e têm
dificuldade para acompanhar o desempenho do negócio. A falta de confirmações
automáticas também aumenta as chances de faltas e deixa o atendimento mais
reativo.

O Navalha.app resolve esse problema ao reunir a rotina da barbearia em um
painel responsivo, com informações organizadas e automações que ajudam a
equipe a atender melhor, reduzir faltas e tomar decisões com base em dados.

## Principais funcionalidades

### Organização da agenda e do atendimento

- Agenda diária com filtros por data e status.
- Confirmações e lembretes de agendamento via WhatsApp.
- Cadastro de clientes com telefone normalizado para o Brasil.
- Interface responsiva, com tema premium e carregamentos em *skeleton*.

### Controle da operação

- Cadastro de serviços e produtos.
- Controle de estoque.
- Usuários e permissões para barbeiros e administradores.

### Acompanhamento de resultados e financeiro

- Dashboard com indicadores, metas e receitas.
- Controle financeiro com entradas, despesas e categorias.
- Relatórios para acompanhar a saúde do negócio.

## Benefícios para a barbearia

- **Mais organização:** toda a operação diária fica centralizada em um único
  sistema.
- **Menos faltas:** os clientes recebem confirmações e lembretes pelo
  WhatsApp.
- **Mais controle:** estoque, caixa, serviços e equipe podem ser acompanhados
  no mesmo ambiente.
- **Decisões melhores:** indicadores, metas e relatórios tornam os resultados
  mais visíveis.
- **Melhor experiência:** equipe e clientes contam com uma interface rápida,
  responsiva e consistente.

## Stack tecnológica

<div align="center">

**Frontend & Backend**
<br/>
<img src="https://skillicons.dev/icons?perline=8&i=nextjs,react,ts,nodejs" />

<br/><br/>

**Estilos & UI**
<br/>
<img src="https://skillicons.dev/icons?perline=8&i=tailwind" />
<img src="https://img.shields.io/badge/-Radix_UI-161618?style=for-the-badge&logo=radixui&logoColor=white" />

<br/><br/>

**Dados & Persistência**
<br/>
<img src="https://skillicons.dev/icons?perline=8&i=postgres,prisma,docker" />

<br/><br/>

**Formulários & Validação**
<br/>
<img src="https://img.shields.io/badge/-React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white" />
<img src="https://img.shields.io/badge/-Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" />

<br/><br/>

**Gráficos & Integrações**
<br/>
<img src="https://img.shields.io/badge/-Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/-Evolution_API-00E676?style=for-the-badge&logo=whatsapp&logoColor=white" />

</div>

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL (Supabase ou servidor próprio)
- Docker e Docker Compose, caso utilize os serviços locais definidos em
  `docker-compose.yml`

## Configuração local

### 1. Clone o repositório

```bash
git clone https://github.com/DOUGLASWEB-DG/Barbeiro-Atual.git
cd Barbeiro-Atual
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie `.env.example` para `.env` e preencha as credenciais do PostgreSQL:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexão principal, com pool de conexões |
| `DIRECT_URL` | Conexão direta usada pelo Prisma nas migrações |

> **Atenção:** nunca envie o arquivo `.env` para o Git.

### 4. Prepare o banco de dados

```bash
npm run db:push
npm run db:seed
```

### 5. Inicie o sistema

**Terminal 1** — aplicação web:

```bash
npm run dev
```

**Terminal 2** — lembretes automáticos:

```bash
npm run cron
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o Next.js em modo de desenvolvimento |
| `npm run build` | Gera o Prisma Client, atualiza o banco e cria o build |
| `npm run start` | Inicia a aplicação compilada |
| `npm run lint` | Executa o ESLint do projeto |
| `npm run format` | Formata os arquivos com Prettier |
| `npm run cron` | Executa o processo de lembretes do WhatsApp |
| `npm run db:push` | Sincroniza o schema do Prisma com o banco |
| `npm run db:migrate` | Cria e executa uma migração do Prisma |
| `npm run db:seed` | Carrega dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Reseta o banco de dados de desenvolvimento |

## Estrutura principal

```text
app/
  api/                 Rotas da API
  dashboard/           Telas administrativas
  book/                Fluxo público de agendamento
components/            Componentes compartilhados
config/                Configurações da barbearia
lib/                   Autenticação, formatação e integrações
prisma/                Schema e seed do banco
public/                Imagens e assets públicos
scripts/               Jobs e automações
```

## Configurações da barbearia

Os dados institucionais — como nome, identidade visual e informações de
contato — ficam centralizados em [`config/tenant.ts`](config/tenant.ts).
Ajuste esse arquivo conforme a identidade da sua unidade.

## Qualidade e validação

Antes de abrir um Pull Request, execute:

```bash
npx tsc --noEmit
npm run lint
```

Ao testar uma alteração visual, valide o dashboard em desktop e em celular,
com atenção especial às telas de Agenda, Clientes e Agendamentos.

## Fluxo Git recomendado

```bash
git checkout -b minha-alteracao
git status
git add arquivo1 arquivo2
git commit -m "Descreve a alteracao"
git push -u origin minha-alteracao
```

Em seguida, abra um Pull Request para `main`. Evite usar `git add .` quando
houver alterações de outras tarefas no mesmo diretório.

## Segurança

- Não compartilhe credenciais, tokens ou arquivos `.env`.
- Valide entradas tanto no frontend quanto na API.
- Utilize HTTPS e variáveis de ambiente protegidas em produção.
- Revise os logs de integrações externas antes de publicar.

## Licença

Uso privado e restrito ao projeto Navalha.app. Consulte os proprietários
antes de redistribuir ou publicar este código.
