# ✂️ Navalha.app — Sistema SaaS para Barbearias

Sistema completo de gestão para barbearia desenvolvido com **Next.js**, **Prisma** (SQLite), **Tailwind CSS** e **TypeScript**.

Tema visual inspirado nas barbearias de **Porto Velho, RO** — tons dourados, escuros e elegantes.

---

## 🚀 Como Rodar (Setup Rápido)

### Pré-requisitos

- **Node.js** 18+ instalado ([baixar aqui](https://nodejs.org/))
- **npm** (vem junto com o Node.js)

### Passo a Passo

```bash
# 1. Clone o repositório (ou copie a pasta)
cd barber-marcedo

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Instale as dependências (já gera o Prisma Client automaticamente)
npm install

# 4. Configure o banco de dados e popule com dados iniciais
npm run setup

# 5. Rode o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas e rotas (Next.js App Router)
│   ├── page.tsx            # Landing page (página inicial)
│   ├── book/               # Página de agendamento online
│   ├── login/              # Página de login
│   ├── dashboard/          # Painel administrativo
│   │   ├── appointments/   # Gerenciar agendamentos
│   │   ├── clients/        # Gerenciar clientes
│   │   ├── finances/       # Controle financeiro
│   │   ├── goals/          # Metas do negócio
│   │   └── services/       # Catálogo de serviços
│   └── api/                # Rotas da API
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes base (botão, input, etc.)
│   ├── dashboard/          # Sidebar, top bar, cards
│   └── ...                 # Modais de formulário
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── seed.ts             # Dados iniciais
├── lib/                    # Utilitários (Prisma client, helpers)
└── .env.example            # Exemplo de variáveis de ambiente
```

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm start` | Inicia o servidor de produção |
| `npm run setup` | Configura o banco + popula dados iniciais |
| `npm run db:migrate` | Roda as migrations do Prisma |
| `npm run db:push` | Sincroniza o schema com o banco |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio (visualizar dados) |
| `npm run db:reset` | Reseta o banco de dados |

---

## 🔐 Login Padrão

Após rodar o seed, use estas credenciais para acessar o painel:

- **Email:** `admin@barberos.com`
- **Senha:** `admin123`

---

## 🎨 Funcionalidades

- ✅ **Landing Page** — Página inicial com serviços, sobre, contato e WhatsApp
- ✅ **Agendamento Online** — Clientes agendam pelo site com integração WhatsApp
- ✅ **Painel Administrativo** — Dashboard completo com métricas
- ✅ **Gestão de Agendamentos** — Criar, editar, confirmar, cancelar
- ✅ **Gestão de Clientes** — Cadastro com histórico de visitas
- ✅ **Controle Financeiro** — Receitas, despesas e lucro
- ✅ **Metas** — Defina e acompanhe metas de receita, clientes e agendamentos
- ✅ **Catálogo de Serviços** — Gerencie preços e duração
- ✅ **Autenticação** — Login protegido para o painel
- ✅ **Tema Escuro Premium** — Visual elegante com tons dourados

---

## 📱 Integração WhatsApp

O sistema integra com WhatsApp para:
- Clientes agendarem diretamente pelo WhatsApp
- Enviar lembretes de agendamento
- Comunicação rápida com clientes

Configure o número do WhatsApp no arquivo `app/page.tsx` (constante `WHATSAPP_NUMBER`).

---

## 🗄️ Banco de Dados

O projeto usa **SQLite** por padrão (arquivo local `dev.db`), ideal para uso em um único computador. Para escalar para múltiplos usuários, basta trocar para **PostgreSQL** no `prisma/schema.prisma`.

---

## 📄 Licença

Projeto privado — uso exclusivo.
