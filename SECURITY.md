# Política de segurança

## Como reportar uma vulnerabilidade

Não abra issue pública. Use **Security > Report a vulnerability** neste repositório (relato privado do GitHub)
ou fale diretamente com os mantenedores. Inclua: o que encontrou, como reproduzir e o impacto esperado.

Responderemos assim que possível e combinaremos a correção e a divulgação antes de qualquer publicação.

## Escopo

| Dentro | Fora |
|---|---|
| Acesso de uma barbearia aos dados de outra | Ataques de negação de serviço por volume |
| Sessão, login, permissões (admin x barbeiro) | Engenharia social |
| Agendamento público (`/book`), fotos (`/media`) | Serviços de terceiros (WhatsApp, provedores) |
| Exposição de dados pessoais de clientes | |

## Práticas do projeto

- Segredos só no ambiente do servidor (arquivos com permissão 600), nunca no Git.
- Toda consulta filtrada pela barbearia, com suíte de isolamento na CI.
- Comandos que gravam dados recusam rodar contra banco remoto.

Modelo completo, controles implementados e riscos conhecidos: [docs/security.md](docs/security.md).
