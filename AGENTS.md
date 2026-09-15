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