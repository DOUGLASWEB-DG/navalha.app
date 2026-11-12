# Validação local — ícones e permissões
Branch: core/permissoes-agenda-2026-11-11. Base da demo conferida: c8482af.
Estado: implementação local; publicação ainda não realizada.

## Evidências
- TypeScript sem erros; lint sem erros, com avisos de imagens já existentes.
- 80 testes automatizados passaram, incluindo a política de permissões.
- 21 verificações da API passaram: escopo do barbeiro, bloqueios do grupo, exceção individual, efeito na mesma sessão, proteção do administrador e isolamento entre barbearias.
- 30 verificações responsivas dos dez diálogos passaram em 390, 768 e 1280 px (resultado em interno/resultado.json).
- Salvar uma exceção individual e salvar o perfil do grupo pela interface passaram (permissoes-ui.json).
- As capturas usam somente dados fictícios de banco local isolado. Não há credenciais reais ou dados dos clientes nestas provas.
- Famílias e configurações das fontes não foram alteradas.

## Limites
- A imagem 1ea1b1a valida somente a primeira etapa dos ícones. Não corresponde às permissões novas.
- A imagem final com as permissões e sua migração ainda precisa ser construída e validada após a revisão independente.
- A auditoria ampla anterior encontrou erros de hidratação React #418 também na versão base e avisos de acessibilidade existentes. Não há aprovação geral de acessibilidade ou desempenho.
- A demo online continua em c8482af. América e Vitor não foram alterados.
- Antes de atualizar a demo: revisão independente (PROC-001), backup do banco da demo, migração aditiva, imagem final, simulação, publicação somente do demo-app e conferência.
- Pacotes: os ícones foram diferenciados; a substituição de “ticar corte” por atendimento com baixa automática está em proposta. A fórmula da comissão não foi alterada.

## Reproduzir
Os scripts verificar-permissoes.cjs, verificar-permissoes-ui.cjs e verificar-interno.cjs registram os testes locais.
O banco é exclusivo de teste na porta 5547; o servidor de prévia usa a porta 3473.

## Publicação na demo — 2026-11-12
- Publicação autorizada pelo Douglas: “vamos subir para o demo”.
- Primeira versão publicada: d758bd3, às 20:26 UTC. Versão final: **555841f**, às 20:48 UTC, com ajuste óptico do ícone Clientes na barra inferior mobile.
- Demo: https://demo.navalhaapp.tech. Login e /book responderam 200 nas duas publicações.
- Backup do banco: /opt/navalha/backup/demo-deploy-d758bd3-20261112-195309/banco.dump (92.073 bytes), com leitura do índice por pg_restore e SHA256 registrados.
- O esquema da demo já continha pacotes/comissões, mas a migração 20261107210000_comissoes_pacotes não estava no histórico. Prisma migrate diff contra o esquema de c8482af retornou “No difference detected”; somente então a migração existente foi registrada como aplicada.
- Aplicada a migração aditiva 20261111150000_team_permissions. As oito migrações ficaram em dia.
- Foram conferidos na demo cinco caminhos públicos, quatro verificações privadas e oito capturas de painel/agenda/pacotes/equipe. Administrador consulta permissões; barbeiro recebe 403 no caixa e nas permissões gerais e vê apenas os próprios agendamentos.
- Mobile: correção de Clientes verificada em 375, 390 e 430 px, sem rolagem horizontal; imagem com ajuste óptico de 1,35 e área de toque de 67 px.
- Famílias das fontes preservadas (Inter confirmada no navegador); não houve alteração da tipografia escolhida.
- América/app e cron seguem em 6897275; Vitor segue em 5c67f4f. IDs e horários de início dos três contêineres ficaram iguais, sem reinício.
- Volta da última imagem: ferramentas-deploy/navalha-atualizar.ps1 demo -Voltar (retorna para d758bd3). A imagem c8482af também permanece disponível; as novas colunas são compatíveis com ela.
- Evidências: qa/2026-11-12-demo-publicada/resultado.json, clientes-mobile.json e capturas; logs ferramentas-deploy/registros/20261112-1726-demo-aplicar.txt e 20261112-1748-demo-aplicar.txt.
- Revisão do diff e verificações realizadas pelo agente executor; não houve revisão por segundo agente. Não há aprovação geral de acessibilidade ou desempenho.
- “Agendar corte / Atender agora” e a nova base de comissão continuam como proposta em docs/pacotes-fluxo-proposto.md. O contador manual existente não foi substituído nesta publicação.

## 12/11/2026 — America publicada e Vitor suspenso

- America atualizada de 6897275 para 555841f, mesma versao aprovada da demo. App e cron em execucao; login e agendamento publico HTTP 200.
- Backup previo: /opt/navalha/backup/america-pre-555841f-20261112-212408/banco.dump, indice pg_restore e SHA256 conferidos.
- Schema anterior comparado com 6897275 sem diferencas. Migracoes 20261107210000_comissoes_pacotes e 20261111150000_team_permissions aplicadas; comparacao final sem diferencas.
- Navegador: inicio, login e book em 390 e 1280 px, seis respostas 200 sem rolagem horizontal. Evidencias em qa/2026-11-12-america-publicada.
- Rollback da imagem: navalha-atualizar.ps1 america -Voltar (6897275). Migracoes aditivas permanecem.
- Vitor suspenso pela parada de sua aplicacao, dados preservados. Backup: /opt/navalha/backup/operacao-20261112-211743. Dominio retorna 502 enquanto a aplicacao permanece parada.
- Nao foram criados dados de teste na America. Fontes mantidas. Nova regra de comissao e consumo de pacotes segue como proposta; nao implementada nesta publicacao.
- Nao houve revisao independente desta versao; verificacoes registradas nao representam aprovacao geral de acessibilidade ou desempenho.
