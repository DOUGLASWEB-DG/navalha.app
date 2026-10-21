## O que muda

<!-- Uma ou duas frases: problema, onde está e o que foi feito. -->

## Por que

<!-- Evidência (log, print, teste que falhava) e decisão tomada. -->

## Como foi validado

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build` (a CI repete)
- [ ] Rota da API alterada: `test:fixture` + `test:isolation` (a CI repete)
- [ ] Tela alterada: conferida no navegador, no computador e no celular (anexe prints)
- [ ] Migration nova: testada num banco descartável; reversão ou plano de correção descrito abaixo

## Riscos e o que não foi testado

<!-- Seja explícito: o que pode quebrar, o que ficou sem prova, o que depende de produção. -->

## Segurança e dados

- [ ] Nenhum segredo, `.env`, dump ou dado real de cliente no diff
- [ ] Toda consulta nova filtra pela barbearia (`barbeariaId`)
- [ ] Dados pessoais (telefone, nome) não vão para logs nem para serviços externos sem necessidade
