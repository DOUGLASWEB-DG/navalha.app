# ADR-0005: Produção em VPS com Docker, PostgreSQL próprio e Caddy

- Status: Aceita
- Data: 2026-10-19

## Contexto

A produção atual usa Supabase. O projeto precisa de processo contínuo (cron), disco para fotos, controle de custos e
experiência operacional (deploy, backup, monitoramento).

## Decisão

- VPS Ubuntu 24.04 com Docker Compose: `app` (imagem standalone do Next, usuário sem privilégio), `db` (PostgreSQL na
  mesma versão maior do Supabase) e `caddy` (HTTPS automático, limite de corpo, IP real).
- Só o Caddy publica portas; banco e app ficam na rede interna.
- Imagem gerada fora da VPS e enviada (`docker save | docker load`); migrations com o Prisma CLI na versão do projeto.
- O Supabase permanece intacto até a VPS estar provada; a migração dos dados exige backup validado e comparação só
  leitura.
- Somente o Navalha na VPS no primeiro momento.

## Alternativas consideradas

- **Manter Supabase + Vercel:** sem disco persistente nem cron; custo cresce com o uso.
- **Kubernetes ou serviços gerenciados:** desproporcional ao tamanho atual.

## Consequências

- Backup, restauração, atualizações e monitoramento passam a ser responsabilidade do projeto.
- Um único servidor é ponto único de falha; mitigado por backup testado e procedimento de restauração.
- Detalhes operacionais em [deploy.md](../deploy.md).
