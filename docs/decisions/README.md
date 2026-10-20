# Registros de decisão de arquitetura (ADRs)

Cada ADR registra uma decisão relevante: o contexto, as alternativas consideradas e as consequências. Um ADR aceito não
é editado para mudar a decisão; uma nova decisão gera um novo ADR que o substitui.

| ADR | Decisão | Status | Data |
|---|---|---|---|
| [0001](0001-banco-unico-barbeariaid.md) | Banco único com `barbeariaId` em toda tabela operacional | Aceita | 2026-10-18 |
| [0002](0002-barbearia-pelo-host.md) | Barbearia descoberta pelo Host; sessão presa ao endereço | Aceita | 2026-10-18 |
| [0003](0003-fuso-da-barbearia.md) | Datas calculadas no fuso IANA da barbearia | Aceita | 2026-10-18 |
| [0004](0004-fotos-em-disco-na-vps.md) | Fotos em disco da VPS (volume), convertidas para WebP | Aceita | 2026-10-18 |
| [0005](0005-deploy-vps-docker.md) | Produção em VPS com Docker, PostgreSQL próprio e Caddy | Aceita | 2026-10-19 |

## Modelo

```markdown
# ADR-NNNN: Título

- Status: Proposta | Aceita | Substituída por ADR-XXXX
- Data: AAAA-MM-DD

## Contexto
## Decisão
## Alternativas consideradas
## Consequências
```
