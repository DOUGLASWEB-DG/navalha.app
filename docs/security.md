# Segurança

Versão: 2026-10-19. Descreve controles **implementados e testados**. Itens planejados estão na seção 6.

## 1. Reportar uma falha

Não abra issue pública. Envie a descrição ao responsável pelo projeto por canal privado, com passos para reproduzir.
Não teste contra a barbearia em produção.

## 2. Isolamento entre barbearias

- Barbearia escolhida pelo Host; Host desconhecido = 404. Sessão presa ao endereço (cookie sem `Domain`) e à barbearia
  (claim `barbeariaId`).
- Toda consulta filtra `barbeariaId`; alterações usam `where { id, barbeariaId }`. Id de outra barbearia = 404.
- Comprovado por `test:isolation` (119 verificações, cobertura de rotas obrigatória) e por análise estática
  (`tests/tenant-queries.test.ts`).

## 3. Autenticação

| Controle | Detalhe |
|---|---|
| Senhas | bcrypt; login com mensagem genérica e hash fictício para e-mail inexistente |
| Sessão | JWT HS256, cookie `httpOnly`/`secure`/`sameSite=lax`; 2 h de inatividade, 8 h no máximo |
| Segredo | `JWT_SECRET` obrigatório, sem valor padrão no código |
| Limites | Login: 5 tentativas por e-mail e 20 por IP a cada 15 min. Reserva pública: 10 por IP/hora, 3 por telefone/dia |
| Redirecionamento | Destino pós-login validado (`lib/safe-redirect.ts`) |
| Papéis | `ADMIN` e `BARBER`, revalidados em cada rota; usuário desativado perde acesso |

O IP só é usado se `RATE_LIMIT_IP_HEADER` apontar para um cabeçalho que o proxy **sobrescreve** (na VPS: `X-Real-IP`,
definido pelo Caddy). Sem isso, valem só os limites por e-mail e telefone.

## 4. Fotos

Tipo detectado pelo conteúdo (não pela extensão); SVG recusado; limite de bytes e de pixels; conversão obrigatória
para WebP, removendo EXIF/GPS; nome gerado pelo servidor (UUID); caminho validado contra fuga de pasta; gravação
atômica; entrega só no endereço da barbearia dona, com `nosniff`. Envio só por `ADMIN`. Detalhes em
[uploads.md](uploads.md).

## 5. Segredos e dados

- `.env`, `.env.*`, dumps e chaves nunca entram no Git nem na imagem Docker (`.gitignore`, `.dockerignore`).
- Na VPS, segredos ficam em arquivos `600` do root, gerados no próprio servidor.
- Comandos que gravam no banco (`db:*`, seed, fixture, suítes) recusam banco que não seja local.
- Produção só recebe migrations e dados por procedimento autorizado e com backup validado ([deploy.md](deploy.md)).

### Servidor (VPS)

SSH só por chave; firewall com entrada apenas em 22, 80 e 443; fail2ban no SSH; Postgres e app sem porta publicada;
Caddy remove `Server` e `X-Powered-By` e limita o corpo da requisição.

## 6. Riscos conhecidos

| Risco | Situação |
|---|---|
| Rate limit em memória | Vale por processo; com mais de um container cada um conta separado |
| Sem monitoramento e alertas | Erros vão para o log do container |
| Backup e restauração | Procedimento escrito; restauração ainda não testada |
| WhatsApp | Instância única; integração por barbearia pendente (Blocos 6 e 7) |
| Exclusão por engano | Sem trilha de auditoria ainda (Bloco 5) |
