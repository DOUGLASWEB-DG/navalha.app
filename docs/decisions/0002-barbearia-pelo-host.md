# ADR-0002: Barbearia descoberta pelo Host; sessão presa ao endereço

- Status: Aceita
- Data: 2026-10-18

## Contexto

Cada barbearia precisa do seu endereço (`america.navalha.app`) e, opcionalmente, de um domínio próprio
(`americabarbearia.tech`). A barbearia de uma requisição não pode depender de dado enviado pelo cliente.

## Decisão

- O middleware (runtime Node.js) resolve a barbearia pelo Host: `<subdominio>.TENANT_ROOT_DOMAIN` ou
  `Barbearia.customDomain`, com cache de 30 s. Host desconhecido, inativo ou reservado responde 404; nunca há
  barbearia padrão como reserva.
- O JWT carrega `barbeariaId`. Token de outra barbearia é descartado.
- O cookie de sessão não tem `Domain`: vale só no endereço exato onde o login aconteceu.
- Ids de outra barbearia respondem 404 (nunca 403), para não revelar que existem.

## Alternativas consideradas

- **Barbearia no caminho (`/b/america/...`):** DNS mais simples, mas mistura rotas e facilita erro de escopo.
- **Cookie em `.navalha.app`:** permitiria login compartilhado entre subdomínios, que é justamente o que não se quer.
- **Barbearia escolhida no login:** depende do cliente; rejeitada.

## Consequências

- Produção precisa de DNS por barbearia (ou curinga) e de proxy que repasse o Host original.
- Desenvolvimento usa `america.localhost:3000`.
- Login em `america.navalha.app` não vale em `americabarbearia.tech` (endereços diferentes, sessões diferentes).
