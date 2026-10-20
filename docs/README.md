# Documentação do Navalha.app

| Para quem | Comece por |
|---|---|
| Quem vai programar | [development.md](development.md), depois [architecture.md](architecture.md) e [testing.md](testing.md) |
| Quem vai implantar ou operar | [deploy.md](deploy.md) e [security.md](security.md) |
| Quem decide prioridades | [roadmap.md](roadmap.md) e [../CHANGELOG.md](../CHANGELOG.md) |
| Agentes de IA | [../AGENTS.md](../AGENTS.md) (regras obrigatórias de trabalho) |

## Documentos

| Documento | Conteúdo |
|---|---|
| [architecture.md](architecture.md) | Visão geral, multi-tenant, sessão, agendamento, fuso, fotos, notificações, dados |
| [development.md](development.md) | Ambiente local, variáveis, banco, fluxo de trabalho, problemas comuns |
| [testing.md](testing.md) | Pirâmide de testes, suítes de integração, lacunas |
| [security.md](security.md) | Controles implementados, segredos, servidor, riscos conhecidos |
| [deploy.md](deploy.md) | Imagem Docker, volume de fotos, migrations, proxy, backup, estado da VPS |
| [uploads.md](uploads.md) | Fotos de serviço e de barbeiro em detalhe |
| [roadmap.md](roadmap.md) | Status por bloco, fases da VPS, dívidas conhecidas |
| [decisions/](decisions/README.md) | ADRs: por que a arquitetura é assim |

## Convenções

- Datas no formato `AAAA-MM-DD`. Cada documento informa quando foi atualizado.
- **Estado atual** (comprovado no código) é separado de **destino** (planejado). O que não foi testado é marcado
  como **NÃO COMPROVADO**.
- Uma decisão de arquitetura nova vira um ADR; o documento afetado passa a apontar para ele.
