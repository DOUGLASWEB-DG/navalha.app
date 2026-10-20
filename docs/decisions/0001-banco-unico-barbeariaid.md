# ADR-0001: Banco único com `barbeariaId` em toda tabela operacional

- Status: Aceita
- Data: 2026-10-18

## Contexto

O Navalha nasceu para uma barbearia (América) e vai atender várias. Os dados de uma barbearia não podem, em nenhuma
hipótese, aparecer ou ser alterados por outra.

## Decisão

Um único banco PostgreSQL. Toda tabela operacional recebe `barbeariaId` (NOT NULL, com chave estrangeira para
`Barbearia`). Registros derivados herdam a barbearia do registro pai. Unicidades passam a ser por barbearia (ex.:
telefone do cliente, nome de categoria). `User.email` continua único em todo o sistema.

## Alternativas consideradas

- **Um banco por barbearia:** isolamento físico, mas migrations, backup e custo multiplicados; desproporcional ao
  tamanho atual.
- **Um schema PostgreSQL por barbearia:** mesmo problema operacional, com complexidade extra no Prisma.
- **Row Level Security no PostgreSQL:** camada adicional valiosa no futuro; exige contexto de sessão em cada conexão
  e ficou para depois.

## Consequências

- Toda consulta precisa filtrar `barbeariaId`. Garantido por revisão, por `tests/tenant-queries.test.ts` (análise
  estática) e por `test:isolation` (comportamento).
- Backup e migrations continuam únicos e simples.
- Um erro de filtro afetaria todas as barbearias: por isso a suíte de isolamento é obrigatória para mudanças na API.
