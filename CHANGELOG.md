# Changelog

Mudanças relevantes do Navalha.app, da mais recente para a mais antiga. Formato inspirado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Cada entrada cita o bloco e os commits principais.

## [Não lançado]: branch `feat/ui-icones-tipografia`

Ainda não está na `main` nem em produção. Validado localmente e, em parte, na VPS de teste.

### Documentação
- README reescrito; documentação organizada em `docs/` (arquitetura, desenvolvimento, testes, segurança, roadmap,
  deploy, fotos) e registros de decisão em `docs/decisions/`.
- `.env.example`: `TENANT_ROOT_DOMAIN` vazio por padrão (com `navalha.app`, o ambiente local respondia 404).

### Infraestrutura (2026-10-19)
- Imagem Docker pronta para produção: `.dockerignore` (nada de `.env` na imagem), pasta de fotos para volume,
  sharp e Prisma comprovados na imagem final (`7518a48`).
- Guia de deploy em VPS e estado do servidor: SSH só por chave, firewall, fail2ban, Docker, Caddy com limite de corpo
  comprovado (`f7f2f43`, `db94b5d`).

### Bloco 4: fotos (2026-10-18 a 2026-10-19)
- Biblioteca de upload: tipo pelo conteúdo, conversão para WebP 800 px, sem EXIF/GPS, disco por barbearia (`a990855`).
- Foto de serviço: envio pelo admin, leitura pública em `/media`, uso no `/book` (`06dc5f7`, `5e44fc7`).
- Foto de barbeiro: envio pelo admin na Equipe, card e `/book` com volta ao ícone (`fe021ce`).
- Testes: 88 verificações de fotos e 119 de isolamento.

### Bloco 3: multi-tenant (2026-10-18 a 2026-10-19)
- Barbearia resolvida pelo Host, 404 para endereço desconhecido (`5b3951a`).
- Sessão presa à barbearia e ao endereço (`90e2551`).
- Toda consulta e alteração filtrada por barbearia; WhatsApp só na barbearia padrão (`2276980`, `7ec1450`).
- Datas no fuso da barbearia no servidor (`8817707`) e nas telas (`4d06d3e`).
- Fixture da barbearia B e suíte de isolamento com cobertura obrigatória de rotas (`2fecc3b`, `cc2430e`).
- Comandos que gravam dados recusam banco que não seja local (`943e3ff`).

### Bloco 2: base de dados (2026-10-18)
- Migrations versionadas a partir de uma baseline; tabela `Barbearia` e `barbeariaId` em toda tabela operacional
  (`f3eac93`).
- Desativar usuário no lugar de excluir (`91400b9`).

### Blocos 0 a 1.5: base e segurança (2026-10-04 a 2026-10-18)
- Correções de controle de acesso e `JWT_SECRET` obrigatório (`87c208f`, `75f2258`).
- Reserva pública dentro de transação serializável (`bb9a242`).
- Limites de tentativa no login e na reserva; redirecionamento seguro (`df8d799`).

### Interface (2026-10-18)
- Agenda agrupada por dia, clientes em tabela, modais com rodapé fixo, ícones e tipografia padronizados, layout do
  painel reorganizado (`b7589c3`, `2ab5cae`, `cca7fd2`, `e0fb528`, `8e7fa9b`, `ddbc410`).
