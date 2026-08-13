# 💈 Navalha.app (BarberOS Premium)

Esquece os sistemas antigos e travados. O **Navalha.app** é um SaaS (Sistema de Gestão) construído do zero para barbearias de alto padrão que querem luxo no visual e automação pesada nos bastidores.

Construído com uma stack moderna de Big Techs, o sistema não só gerencia agenda e financeiro, mas **trabalha sozinho por você**, disparando mensagens no WhatsApp dos clientes sem que você precise tocar no celular. 🤖📲

## 📸 Telas do Sistema

> *O visual reflete a excelência do serviço. Interface Glassmorphism com tons de Dark Slate e Dourado (Amber).*

<div align="center">
  <img src="https://via.placeholder.com/800x450/0f172a/eab308?text=Tela+de+Login+(Arraste+sua+foto+aqui)" alt="Login" width="48%">
  <img src="https://via.placeholder.com/800x450/0f172a/eab308?text=Dashboard+Principal+(Arraste+sua+foto+aqui)" alt="Dashboard" width="48%">
</div>

<br>

<div align="center">
  <img src="https://via.placeholder.com/800x450/0f172a/eab308?text=Tela+de+Agendamentos+(Arraste+sua+foto+aqui)" alt="Agendamentos" width="48%">
  <img src="https://via.placeholder.com/800x450/0f172a/eab308?text=Controle+Financeiro+(Arraste+sua+foto+aqui)" alt="Finanças" width="48%">
</div>

---

## 🚀 Tech Stack (O Motor da Máquina)
- **Frontend & Backend:** Next.js 14 (App Router) + TypeScript
- **Banco de Dados:** PostgreSQL (via Prisma ORM)
- **Design & UX:** Tailwind CSS, Shadcn UI, Glassmorphism e Skeletons (Performance Percebida)
- **Motor de WhatsApp:** Evolution API V2 (Rodando em Docker)
- **Jobs em Background:** Cron nativo no Node via `tsx`

---

## 🔥 As Mágicas do Sistema

### 1. UX Premium & Performance Percebida
O sistema não tem "tela de carregamento chata". Adotamos o uso pesado de **Skeleton Loaders** (igual YouTube e Instagram). Quando você navega entre Clientes, Agenda ou Finanças, a tela muda instantaneamente e pulsa o design (Perceived Performance).
As cores giram em torno do **Dark Slate e Dourado (Amber)**, passando a exata sensação de um produto de 5 mil reais/mês.

### 2. O Robô de WhatsApp 100% Invisível
Adeus "clique aqui para enviar mensagem". O sistema está conectado diretamente ao seu número via API e faz tudo por baixo dos panos:
- Mudou um agendamento para "Confirmado"? O cliente recebe a confirmação com data e hora.
- Marcou como "Concluído"? O sistema registra o dinheiro no fluxo de caixa automático e avisa o dono.

### 3. O Lembrete de 1 Hora (Cron Job)
Temos um Script autônomo rodando a cada 5 minutos no servidor (`npm run cron`). Ele varre o banco de dados buscando quem tem corte marcado para a próxima hora e dispara: *"Fala mestre! Passando pra lembrar que falta cerca de 1 horinha pro nosso corte."* Nunca mais um cliente esquece o horário!

---

## 🛠️ Como rodar essa nave?

### 1. Subindo os contêineres
Você vai precisar do Docker rodando para o Banco de Dados e para a API do WhatsApp.
```bash
docker-compose up -d
```

### 2. Instalando as dependências e o Banco
```bash
npm install
npm run db:push
npm run db:seed
```

### 3. Ligando os motores
Abra **dois** terminais no seu VS Code:

Terminal 1 (Roda o site):
```bash
npm run dev
```

Terminal 2 (Roda o Robô de Lembretes Automáticos):
```bash
npm run cron
```

Pronto! Acesse `http://localhost:3000`. 

*(As configurações globais do sistema, como o seu Número de WhatsApp e Nome da Barbearia, ficam centralizadas num único arquivo fácil de editar em `config/tenant.ts`)*

---
*Feito com um Toque Impecável. 🍷🗿*
