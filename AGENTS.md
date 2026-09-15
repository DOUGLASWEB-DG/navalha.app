# Navalha.app - Agents & Development Guidelines

Este arquivo define as restrições e diretrizes fundamentais para qualquer alteração feita no projeto Navalha.app, servindo como "bússola" para manter a integridade do sistema.

## Princípios de Arquitetura

1. **Preservar o que funciona**: Antes de propor uma grande refatoração, mapeie as dependências.
2. **Mudanças Incrementais**: Mude pequenos módulos por vez, com pontos de segurança.
3. **Segurança First**: Sessões, cookies e dados sensíveis NUNCA devem trafegar em texto puro ou depender do *client*.
4. **Resolução de Concorrência**: Qualquer reserva de horário, criação de recurso duplo ou operações financeiras devem usar blocos transacionais seguros.

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