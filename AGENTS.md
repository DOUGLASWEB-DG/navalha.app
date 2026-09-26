# Navalha.app - Agents & Development Guidelines

Este arquivo define as restrições e diretrizes fundamentais para qualquer alteração feita no projeto Navalha.app, servindo como "bússola" para manter a integridade do sistema.

## Princípios de Arquitetura

1. **Preservar o que funciona**: Antes de propor uma grande refatoração, mapeie as dependências.
2. **Mudanças Incrementais**: Mude pequenos módulos por vez, com pontos de segurança.
3. **Segurança First**: Sessões, cookies e dados sensíveis NUNCA devem trafegar em texto puro ou depender do *client*.
4. **Resolução de Concorrência**: Qualquer reserva de horário, criação de recurso duplo ou operações financeiras devem usar blocos transacionais seguros.

# Contexto Mestre do Navalha.app

## 1. Identidade do Projeto

O Navalha.app é atualmente um monólito web construído principalmente com:

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- Supabase
- Tailwind CSS
- SWR
- JWT
- Vercel

Integrações atuais ou em evolução:

- Evolution API
- WhatsApp
- n8n

O sistema possui funcionalidades relacionadas a:

- autenticação;
- usuários/barbeiros;
- clientes;
- serviços;
- agendamentos;
- múltiplos serviços por agendamento;
- financeiro;
- produtos;
- metas;
- categorias;
- alertas financeiros;
- eventos;
- notificações.

---

# 2. Visão Arquitetural de Longo Prazo

O Navalha.app está sendo desenvolvido com visão de evolução para uma plataforma SaaS multi-tenant.

Visão conceitual:

NAVALHA.APP
│
├── Plataforma
│   ├── Platform Admin
│   ├── Planos
│   ├── Assinaturas
│   └── Billing
│
└── Tenants
    ├── Barbearia A
    ├── Barbearia B
    ├── Barbearia C
    └── futuros tenants

Cada tenant deverá possuir isolamento lógico de seus dados operacionais.

Exemplos:

- usuários;
- barbeiros;
- clientes;
- serviços;
- agendamentos;
- serviços dos agendamentos;
- financeiro;
- produtos;
- metas;
- categorias;
- notificações;
- fidelidade.

A plataforma deverá possuir dados próprios relacionados a:

- tenants;
- planos;
- assinaturas;
- cobrança;
- administração da plataforma;
- limites e recursos contratados.

IMPORTANTE:

Esta é uma arquitetura de DESTINO.

Não significa que essas entidades ou relações já existam no código atual.

Nunca implementar uma estrutura futura simplesmente porque ela aparece neste documento.

Antes de implementar qualquer parte da arquitetura futura:

1. analisar a arquitetura atual;
2. localizar as dependências;
3. identificar impactos;
4. definir a decisão arquitetural;
5. obter autorização;
6. implementar incrementalmente.

---

# 3. Regra Fundamental: Estado Atual ≠ Arquitetura Futura

Sempre diferenciar:

### ESTADO ATUAL

Aquilo que foi comprovado diretamente pelo código, banco, configuração ou documentação existente.

### ARQUITETURA DE DESTINO

Aquilo que está planejado para evolução futura.

### HIPÓTESE

Uma explicação ou possibilidade ainda não comprovada.

### DECISÃO

Uma escolha arquitetural que ainda precisa ser tomada.

### NÃO COMPROVADO

Algo que não pôde ser confirmado através das fontes disponíveis.

Nunca tratar arquitetura futura como se já estivesse implementada.

---

# 4. Regra Contra Alucinação Arquitetural

Não inventar:

- campos;
- tabelas;
- relações;
- endpoints;
- serviços;
- eventos;
- payloads;
- bibliotecas;
- integrações;
- regras de negócio.

Se algo não for encontrado:

`NÃO LOCALIZADO`

Se houver dúvida:

`NÃO COMPROVADO`

Se for uma inferência:

`INFERÊNCIA`

Se código e documentação divergirem:

`INCONSISTÊNCIA ENTRE CÓDIGO E DOCUMENTAÇÃO`

Não preencher lacunas com suposições.

---

# 5. Regra de Evidência

Toda decisão técnica relevante deve partir de evidência.

Antes de propor uma mudança:

1. localizar o código envolvido;
2. entender o fluxo;
3. identificar dependências;
4. identificar efeitos colaterais;
5. verificar se já existe solução para o problema;
6. verificar documentação ou decisões anteriores;
7. somente então propor a mudança.

Não considerar uma solução correta apenas porque:

- funciona localmente;
- o build passou;
- o TypeScript passou;
- o workflow executou;
- a API respondeu 200.

Esses resultados comprovam apenas o comportamento testado.

---

# 6. Regra de Escopo

O agente deve trabalhar somente dentro do escopo explicitamente autorizado.

Encontrar um problema diferente durante uma tarefa NÃO autoriza sua correção.

Nesse caso:

PROBLEMA ENCONTRADO
→ registrar
→ explicar impacto
→ propor futura etapa
→ continuar somente dentro do escopo autorizado.

Não transformar uma tarefa de investigação em refatoração.

Não transformar uma correção em redesign arquitetural.

---

# 7. Regra Contra Overengineering

O Navalha atualmente é um monólito Next.js + Prisma + PostgreSQL.

Não introduzir arquitetura distribuída sem evidência concreta.

Não propor ou implementar automaticamente:

- microserviços;
- CQRS;
- Event Sourcing;
- Kafka;
- Kubernetes;
- múltiplos bancos;
- filas externas;
- Redis;
- infraestrutura adicional complexa.

Essas tecnologias somente podem ser consideradas quando existir um problema concreto que justifique sua utilização.

Preferir:

simples
→ explícito
→ incremental
→ observável
→ testável
→ compatível com o sistema atual.

---

# 8. Continuidade Arquitetural

O Navalha.app não deve ser tratado como um projeto novo a cada tarefa.

Antes de criar uma solução:

- procurar implementações existentes;
- procurar decisões anteriores;
- procurar documentação;
- procurar código legado ainda utilizado;
- procurar integrações existentes;
- procurar impactos nas fases anteriores.

Não recriar funcionalidades que já existem.

Não substituir uma solução existente sem explicar:

- problema atual;
- evidência;
- impacto;
- alternativa;
- motivo da mudança.

---

# 9. Arquitetura de Autenticação

A autenticação atual utiliza JWT e cookie de sessão.

O agente deve considerar que autenticação e autorização são partes críticas da arquitetura.

No futuro, uma arquitetura multi-tenant provavelmente exigirá contexto de tenant associado à identidade/autorização.

IMPORTANTE:

Não adicionar `tenantId` ao JWT apenas porque essa possibilidade existe neste documento.

Não alterar:

- `lib/auth.ts`;
- `middleware.ts`;
- cookies;
- claims;
- sessões;

sem autorização explícita para a fase correspondente.

---

# 10. Isolamento Multi-Tenant

Quando o projeto entrar na implementação multi-tenant, o isolamento de dados será requisito de segurança fundamental.

Nenhum usuário de um tenant poderá acessar ou modificar dados de outro tenant.

Antes de implementar multi-tenancy, o agente deverá mapear:

- autenticação;
- autorização;
- APIs;
- Prisma;
- relações entre entidades;
- criação;
- leitura;
- atualização;
- exclusão;
- eventos;
- jobs;
- integrações externas.

Não assumir automaticamente que adicionar `tenantId` em todas as tabelas é a solução correta.

Primeiro analisar o modelo atual.

---

# 11. Eventos e Automações

A arquitetura desejada é separar:

REGRA DE NEGÓCIO

→ FATO/EVENTO

→ AUTOMAÇÃO

→ INTEGRAÇÃO EXTERNA

O Navalha deve ser responsável por registrar fatos de negócio.

O n8n deverá futuramente ser responsável pela orquestração das automações.

Exemplo conceitual:

Appointment criado
→ appointment.created
→ n8n
→ WhatsApp / notificação / outras automações

O Navalha não deve assumir automaticamente a responsabilidade de montar mensagens ou controlar fluxos externos.

Porém:

A implementação atual deve sempre ser investigada antes de qualquer migração.

Não remover Evolution API ou WhatsApp existente sem uma fase de migração autorizada.

---

# 12. Consistência de Eventos

Eventos devem representar fatos de negócio reais.

Não disparar eventos antes de uma operação crítica estar efetivamente persistida.

Sempre considerar:

- transação;
- falha do banco;
- falha do webhook;
- retry;
- duplicidade;
- idempotência;
- ordenação;
- observabilidade.

Não implementar Outbox, filas ou mecanismos de retry avançados sem autorização específica.

---

# 13. Regra de Aprendizado

O agente deve explicar o raciocínio técnico, não somente entregar código.

Quando uma decisão importante for proposta, explicar:

1. qual problema existe;
2. onde ele existe;
3. qual evidência foi encontrada;
4. quais alternativas existem;
5. quais são os trade-offs;
6. qual decisão ainda precisa ser tomada.

O objetivo é permitir que o desenvolvedor compreenda a arquitetura e consiga reproduzir o raciocínio sozinho.

---

# 14. Regra de Fases

O desenvolvimento do Navalha deve seguir:

ANALISAR
↓
MAPEAR
↓
MEDIR
↓
DECIDIR
↓
PLANEJAR
↓
IMPLEMENTAR
↓
VALIDAR
↓
DOCUMENTAR

Não pular diretamente de:

"encontrei um problema"

para:

"vou refatorar o sistema".

Cada fase deve possuir escopo explícito.

---

# 15. Regra de Preservação

Alterações existentes do usuário devem ser preservadas.

Nunca:

- restaurar arquivos sem autorização;
- apagar alterações;
- executar reset;
- executar clean;
- substituir mudanças do usuário;
- sobrescrever arquivos fora do escopo.

Antes de qualquer alteração relevante:

`git status`

deve ser analisado.

---

# 16. Critério de Conclusão

Nenhuma solução deve ser declarada como definitivamente correta somente porque foi implementada.

O agente deve informar:

- o que foi alterado;
- por que foi alterado;
- quais testes foram executados;
- quais resultados foram obtidos;
- quais cenários não foram testados;
- quais riscos permanecem;
- quais hipóteses continuam sem comprovação.


## UX/UI Principles (Aderência)
1. **Design "Invisível"**: Sem overdesign (remover uppercase extremo, letter-spacing exagerado e pesos black sem necessidade).
2. **Mobile First real**: Elementos críticos de toque com no mínimo 44x44px. Modais/Dialogs não podem flutuar no mobile; devem ser Fullscreen ou Bottom Sheets.
3. **Consistência**: Uso estrito dos tokens de espaçamento e bordas (`rounded-2xl`, `gap-3`).

## Processo de Trabalho do Agente

Antes de alterar código:

1. Entender o problema.
2. Localizar arquivos e dependências envolvidas.
3. Identificar riscos e efeitos colaterais.
4. Propor um plano de implementação.
5. Aguardar autorização para mudanças relevantes.

Durante a implementação:

6. Alterar apenas o escopo autorizado.
7. Evitar refatorações não relacionadas.
8. Manter compatibilidade com funcionalidades existentes.
9. Validar cada etapa.

Após a implementação:

10. Executar testes, typecheck, lint e build quando aplicável.
11. Revisar o diff completo.
12. Explicar o que foi alterado e por quê.
13. Informar quais testes foram executados e seus resultados.
14. Informar riscos ou pontos ainda não validados.
15. Não declarar uma solução como correta sem apresentar evidências.

## 2. UX/UI Principles & Visual Identity

### 2.1 Padrão Visual Premium (Modern Dark & Contrast)
- **Tema Base:** Dark mode elegante por padrão (`bg-[#0d0f12]` ou `bg-zinc-950`). Evitar preto puro absoluto `#000000` em áreas de leitura para manter conforto visual.
- **Cor de Destaque (Brand/Accent):** Usar cor de alta energia e conversão pontual (ex: Dourado/Amarelo Âmbar `text-amber-400`, `bg-amber-500`) exclusivamente para:
  - Palavras-chave do título principal (Hero);
  - Números de impacto / métricas;
  - Botão de ação primário (CTA).
- **Cores Neutras e Textos:**
  - Título / Headings: `text-white font-bold tracking-tight`;
  - Subtítulo / Textos secundários: `text-zinc-400 font-normal leading-relaxed`;
  - Bordas / Divisores sutis: `border-zinc-800/60` ou `border-white/5`.

### 2.2 Estrutura de Seções de Alto Impacto (Ex: Landing & Painéis)
- **Hero Section:**
  - Título direto e de alto impacto com destaque na última palavra/frase-chave;
  - Subtítulo explicativo conciso (máximo 2 a 3 linhas);
  - CTA primário largo e arredondado (`rounded-full` ou `rounded-xl`), com texto objetivo (ex: "Quero Agendar" / "Começar Agora");
  - Floating triggers úteis (ex: suporte rápido/WhatsApp no topo ou canto inferior).
- **Bloco de Prova Social e Números:**
  - Métricas expressivas com número em destaque (`text-3xl` a `text-5xl font-extrabold text-amber-500`) acompanhado de rótulo claro em caixa-alta sutil (`text-xs uppercase tracking-wider text-zinc-400`);
  - Grid de marcas/parceiros: organizado em cards uniformes (`bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-center`).

### 2.3 Tipografia e Escala Visual
- Proporção rígida de hierarquia:
  - **H1 (Hero):** 36px a 56px (bold/extrabold)
  - **H2 (Seções):** 28px a 36px (bold)
  - **H3 / Cards:** 18px a 20px (semibold)
  - **Body text:** 15px a 16px (regular)
  - **Microcopy / Badges:** 12px a 13px (medium)
- Evitar títulos monótonos: sempre criar contraste entre o texto comum e a palavra-chave de destaque.

### 2.4 Mobile First & Ergonomia
- Elementos clicáveis com área mínima de 44x44px;
- Navegação mobile limpa com menu responsivo e sem corte de margens laterais (`px-4 sm:px-6 lg:px-8`);
- Em dispositivos móveis, os grids de logos e métricas devem quebrar em 2 colunas (`grid-cols-2`) para não espremer conteúdo;
- Modais críticos adaptados para Bottom Sheets ou tela cheia em telas pequenas.

### 2.5 Consistência de Componentes
- Manter o raio de arredondamento padrão do projeto (`rounded-2xl` para cards, `rounded-xl` para botões secundários);
- Estados de hover suaves (`transition-all duration-200 hover:scale-[1.02]`);
- Sempre prever estados: default, hover, focus-visible, disabled e loading.
# Tarefa: Investigar desacoplamento das notificações via eventos + n8n

## Contexto

O Navalha.app possui atualmente integrações de WhatsApp diretamente no código, incluindo lógica relacionada a mensagens e lembretes.

Queremos evoluir a arquitetura para desacoplar a regra de negócio das automações externas.

A arquitetura desejada é:

Navalha.app
    ↓
Evento de domínio/aplicação
    ↓
Webhook n8n
    ↓
Automação n8n
    ├── mensagem para cliente
    ├── mensagem para barbeiro
    └── futuras automações

O Navalha NÃO deve ser responsável por montar o texto da mensagem nem por controlar o fluxo da automação.

O Navalha deve ser responsável por informar que um evento de negócio aconteceu e fornecer os dados necessários.

## Exemplo

Quando um agendamento é criado:

event = appointment.created

O Navalha deverá futuramente emitir um payload semelhante a:

{
  "event": "appointment.created",
  "appointmentId": "...",
  "status": "CONFIRMED",

  "client": {
    "id": "...",
    "name": "...",
    "phone": "..."
  },

  "barber": {
    "id": "...",
    "name": "...",
    "phone": "..."
  },

  "appointment": {
    "date": "...",
    "startTime": "...",
    "duration": "...",
    "services": [],
    "total": "...",
    "notes": "..."
  }
}

IMPORTANTE:

Esse payload é apenas uma proposta inicial.

Antes de implementar, investigue o modelo atual do Navalha e determine quais desses dados já existem, onde estão armazenados e como são obtidos.

Não invente campos nem altere o banco apenas para encaixar o exemplo.

---

# Objetivo desta etapa

NÃO implementar ainda.

Primeiro investigar e apresentar um plano.

Mapear:

1. Onde um agendamento é criado.
2. Onde um agendamento é atualizado.
3. Onde um agendamento é cancelado.
4. Onde atualmente o Navalha dispara mensagens WhatsApp.
5. Onde está implementada a integração com Evolution API.
6. Onde está implementado o cron de lembretes.
7. Quais APIs/services/utilitários participam desse fluxo.
8. Quais dados do cliente estão disponíveis.
9. Quais dados do barbeiro estão disponíveis.
10. Se o telefone do barbeiro está disponível no modelo atual.
11. Se os serviços do agendamento estão disponíveis através do relacionamento atual.
12. Em que ponto da transação o evento poderia ser disparado com segurança.

---

# Regra arquitetural importante

Não devemos disparar o webhook simplesmente no começo da criação do agendamento.

Precisamos analisar o momento correto para evitar:

Banco:
    agendamento criado
    ↓
    erro posteriormente
    ↓
Webhook enviado indevidamente

O evento deve representar um fato de negócio confirmado.

Investigue como garantir que:

"appointment.created"

somente seja emitido quando o agendamento realmente tiver sido persistido com sucesso.

Também investigar o risco de:

Banco confirmou
    ↓
Webhook falhou

Nesse caso, analisar possíveis estratégias futuras de retry, fila/outbox ou outra solução apropriada.

NÃO implementar uma solução de fila/outbox sem autorização.

---

# Segurança

O webhook n8n não deve receber informações sensíveis desnecessárias.

Investigar:

- autenticação do webhook;
- segredo/token;
- armazenamento das credenciais;
- headers;
- timeout;
- tratamento de erro;
- logs;
- exposição de dados pessoais;
- possibilidade de replay;
- idempotência.

Segredos NÃO podem ser colocados no código ou commitados no Git.

---

# Compatibilidade

Não remover ainda:

- lib/whatsapp.ts;
- scripts/cron.ts;
- chamadas atuais da Evolution API;
- qualquer integração existente.

Primeiro precisamos entender o fluxo atual e provar a nova arquitetura.

A migração deverá ser incremental.

---

# Resultado esperado da investigação

Antes de alterar código, apresentar:

## 1. Fluxo atual

Exemplo:

agendamento
→ arquivo X
→ função Y
→ integração Z
→ WhatsApp

## 2. Fluxo proposto

agendamento
→ persistência
→ evento appointment.created
→ webhook n8n

## 3. Arquivos envolvidos

Listar arquivos reais encontrados no projeto.

## 4. Dados disponíveis

Informar quais dados já podem compor o evento.

Separar:

- disponíveis imediatamente;
- disponíveis através de relacionamento;
- inexistentes atualmente;
- que exigiriam alteração de banco.

## 5. Riscos

Principalmente:

- evento enviado antes da confirmação;
- webhook indisponível;
- duplicidade;
- retry;
- alteração de comportamento existente;
- vazamento de dados;
- acoplamento entre Navalha e n8n.

## 6. Plano incremental

Propor fases pequenas, por exemplo:

Fase A
Mapear fluxo atual.

Fase B
Definir contrato do evento.

Fase C
Criar emissor de eventos sem remover WhatsApp atual.

Fase D
Testar webhook n8n.

Fase E
Provar evento appointment.created.

Fase F
Migrar uma notificação para n8n.

Fase G
Validar produção.

Fase H
Somente depois avaliar remoção da integração antiga.

Aguardar autorização antes de implementar qualquer uma dessas fases.

---

# Regra de aprendizado

Não quero apenas uma solução pronta.

Explique:

- por que o evento deve existir;
- por que o Navalha não deve montar a mensagem;
- por que o n8n deve cuidar da automação;
- onde existe risco de inconsistência;
- como provar que o evento representa um agendamento realmente criado;
- como evitar notificações duplicadas.

Não declarar a arquitetura como correta apenas porque o workflow do n8n executou com sucesso.

Precisamos validar o comportamento ponta a ponta.

# Documentação Oficial e Fontes de Verdade

Quando uma tarefa envolver comportamento específico de uma tecnologia,
framework, biblioteca, API ou integração externa, o agente deve priorizar
a documentação oficial e a versão utilizada pelo projeto.

## Regra de prioridade

1. Código atual do projeto
2. Documentação oficial da tecnologia
3. Documentação oficial da biblioteca/serviço
4. Decisões/documentação interna do projeto
5. Issues/discussões oficiais do projeto
6. Outras fontes técnicas confiáveis
7. Conhecimento geral do modelo

Não substituir o comportamento real do projeto por exemplos genéricos
encontrados na internet.

---

## Tecnologias principais

### Next.js

Documentação oficial:

https://nextjs.org/docs

Usar especialmente para validar:

- App Router
- Route Handlers
- Middleware
- Server Components
- Client Components
- caching
- revalidation
- cookies
- headers
- redirects
- rendering
- deployment

---

### React

Documentação oficial:

https://react.dev/

Usar para validar:

- hooks
- effects
- rendering
- state
- server/client boundaries
- componentes
- comportamento de versões atuais

---

### TypeScript

Documentação oficial:

https://www.typescriptlang.org/docs/

Usar para validar:

- tipos
- generics
- narrowing
- utility types
- module behavior
- compiler configuration
- strict mode

---

### Prisma

Documentação oficial:

https://www.prisma.io/docs

Usar para validar:

- schema
- relations
- transactions
- interactive transactions
- isolation levels
- migrations
- Prisma Client
- connection management
- PostgreSQL
- índices
- queries

---

### PostgreSQL

Documentação oficial:

https://www.postgresql.org/docs/

Usar para validar:

- transactions
- isolation levels
- constraints
- indexes
- locks
- concurrency
- SQL behavior

---

### Supabase

Documentação oficial:

https://supabase.com/docs

Usar para validar:

- PostgreSQL
- connection pooling
- database connectivity
- deployment
- authentication, quando aplicável
- infraestrutura relacionada ao banco

---

### n8n

Documentação oficial:

https://docs.n8n.io/

Usar para validar:

- Webhooks
- workflows
- credentials
- expressions
- executions
- retries
- error handling
- idempotency
- HTTP requests
- production behavior

---

### Vercel

Documentação oficial:

https://vercel.com/docs

Usar para validar:

- deployment
- environment variables
- serverless functions
- runtime
- build
- caching
- observability
- production behavior

---

### Tailwind CSS

Documentação oficial:

https://tailwindcss.com/docs

Usar para validar:

- utility classes
- responsive behavior
- breakpoints
- configuration
- theme
- CSS behavior

---

## Regra de versão

Sempre que uma dúvida depender de versão:

1. verificar a versão instalada no projeto;
2. consultar a documentação correspondente;
3. não assumir que documentação de outra versão possui o mesmo comportamento.

Exemplo:

Next.js 15/16 não deve ser tratado automaticamente como Next.js 13/14.

---

## Regra para APIs externas

Para APIs externas:

- consultar documentação oficial;
- verificar autenticação;
- verificar formato do payload;
- verificar status HTTP;
- verificar limites;
- verificar timeout;
- verificar retry;
- verificar comportamento de produção.

Não inventar endpoints ou parâmetros.

---

## Regra de atualização

Se a documentação oficial contradizer conhecimento anterior do agente:

priorizar a documentação oficial correspondente à versão utilizada.

Se houver diferença entre:

DOCUMENTAÇÃO
vs
CÓDIGO ATUAL

não corrigir automaticamente.

Registrar:

`INCONSISTÊNCIA ENTRE DOCUMENTAÇÃO E IMPLEMENTAÇÃO`

e explicar o impacto.

---

## Regra contra documentação genérica

Exemplos encontrados na documentação não devem ser copiados
automaticamente para o projeto.

Antes de aplicar qualquer exemplo:

1. verificar compatibilidade com a versão;
2. verificar arquitetura atual;
3. verificar dependências;
4. verificar impacto;
5. verificar se o padrão realmente resolve o problema.

---

## Regra para decisões arquiteturais

Documentação oficial responde:

"Como a tecnologia funciona?"

Ela não responde automaticamente:

"Como o Navalha deve ser arquitetado?"

Decisões arquiteturais devem considerar:

- requisitos do Navalha;
- arquitetura atual;
- segurança;
- multi-tenancy futuro;
- performance;
- manutenção;
- complexidade;
- custo operacional;
- compatibilidade.

A documentação é fonte técnica, não substituto da decisão arquitetural.