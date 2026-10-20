# Testes

Regra do projeto: build, typecheck ou "a API respondeu 200" não provam que uma mudança está correta. Cada mudança
relevante é validada pelo comportamento, incluindo o cenário ruim (outra barbearia, arquivo malicioso, fuso
diferente). Ver [AGENTS.md](../AGENTS.md), "Regra de Evidência".

## 1. Pirâmide atual

| Nível | Comando | Precisa de | O que cobre |
|---|---|---|---|
| Tipos | `npx tsc --noEmit` | nada | Erros de tipo (o build não pega) |
| Lint | `npm run lint` | nada | Regras do ESLint/Next |
| Unitários | `npm test` | nada | Host e subdomínios, fuso, validação de imagem e caminhos de arquivo, filtro por barbearia nas consultas |
| Integração: isolamento | `npm run test:isolation` | servidor + banco local + fixture | Toda rota da API contra a barbearia errada |
| Integração: fotos | `npm run test:uploads` | servidor + banco local + fixture + `UPLOADS_DIR` | Envio, leitura, troca, remoção, isolamento e arquivos maliciosos |

## 2. Testes unitários (`tests/*.test.ts`)

| Arquivo | Garante |
|---|---|
| `tenant-host.test.ts` | Leitura do Host, subdomínios reservados, domínio próprio, normalização |
| `time-zone.test.ts` | Limites de dia/semana/mês no fuso da barbearia, inclusive 23:30 na virada |
| `uploads.test.ts` | Tipo pelo conteúdo, limites de tamanho e pixels, remoção de EXIF, chaves e caminhos seguros |
| `tenant-queries.test.ts` | Análise estática: toda chamada Prisma em tabela de barbearia menciona `barbeariaId` |

## 3. Suítes de integração

Rodam contra um servidor **real** (build de produção) e o banco **local**. Recusam banco remoto.

```bash
npm run test:fixture                     # barbearia B (teste-b) + usuários smoke.* na América
npm run build
TENANT_ROOT_DOMAIN=navalha.app UPLOADS_DIR=/tmp/fotos-teste npx next start -p 3131
TEST_PORT=3131 npm run test:isolation
UPLOADS_DIR=/tmp/fotos-teste TEST_PORT=3131 npm run test:uploads
```

- **Isolamento** (119 verificações, 46 rota+método): admin da barbearia A tenta ler, alterar e apagar dados de B
  por id; token de A no endereço de B; contagens no banco antes e depois. **Cobertura obrigatória:** a suíte lê as
  pastas `app/api` e falha se existir rota sem caso de teste.
- **Fotos** (88 verificações): a mesma bateria para foto de serviço e de barbeiro, mais exclusão de usuário apagando a
  foto.
- A senha da fixture está no repositório. Ela existe só em bancos de teste e é apagada ao final de qualquer uso fora do
  computador local.

## 4. Testes no navegador

Roteiros com Edge headless via CDP (fora do repositório): login real, telas principais, agenda em fusos diferentes
(São Paulo, Tóquio, Porto Velho), foto pela tela e `/book` no celular. Resultados registrados por bloco no
[CHANGELOG](../CHANGELOG.md).

## 5. Lacunas conhecidas

| Lacuna | Impacto | Plano |
|---|---|---|
| `test-concurrency.ts` quebrado desde o Bloco 3 | A proteção contra horário duplo existe, mas não é provada automaticamente | Bloco 7 |
| Sem CI | Tudo depende de alguém rodar | Pipeline mínimo (tsc, testes, build) |
| Roteiros de navegador fora do repositório | Não são reproduzíveis por outra pessoa | Trazer para `tests/e2e` |
| `next.config.js` com `ignoreBuildErrors` | O build passa com erro de tipo | Desligar após o CI |
