# Fotos de serviço (uploads)

Estado: o admin envia a foto de um serviço em Serviços > Editar serviço; ela aparece na página de agendamento
(`/book`). Foto de barbeiro (`avatarUrl`) ainda não tem tela nem rota (o campo existe no banco).

## Como funciona

| Peça | Arquivo |
|---|---|
| Validação e conversão (JPEG/PNG/WebP, 2 MB, 40 MP, saída WebP até 800 px, sem EXIF/GPS) | `lib/uploads/image.ts` |
| Gravação no disco, chave `<barbeariaId>/services/<uuid>.webp`, marcador do volume | `lib/uploads/storage.ts` |
| Envio e remoção (somente ADMIN da barbearia) | `app/api/services/[id]/image/route.ts` |
| Leitura pública | `app/media/[...key]/route.ts` |
| Formulário do admin | `components/services/service-form-modal.tsx` |

- O banco guarda só a URL pública (`Service.imageUrl = /media/<chave>`); o cliente nunca informa o caminho.
- Cada troca de foto gera um UUID novo, por isso a URL pode ficar em cache para sempre (`immutable`).
- A rota `/media` só entrega a foto ao Host da barbearia dona dela. O matcher do middleware ignora URLs `.webp`,
  então a rota confere o tenant sozinha.
- `getServiceImage` em `app/book/page.tsx` continua como reserva para serviço sem foto.

## Configuração por servidor

1. Defina `UPLOADS_DIR`. Em produção precisa ser caminho **absoluto** de um volume persistente (ex.: `/data/uploads`).
2. Uma vez por volume: `npm run uploads:init` (cria a pasta e o arquivo `.navalha-uploads`).
3. Sem a variável, sem a pasta ou sem o marcador, o envio responde **503** e nada é gravado. Isso evita gravar
   dentro do container (as fotos sumiriam no próximo deploy).

### Docker

Monte o volume em `UPLOADS_DIR` e rode o init dentro do container, uma vez. O usuário do container (`nextjs`, uid 1001)
precisa de permissão de escrita na pasta do volume.

```yaml
services:
  navalha:
    environment:
      UPLOADS_DIR: /data/uploads
    volumes:
      - navalha_uploads:/data/uploads
volumes:
  navalha_uploads:
```

### Limites de tamanho no proxy

O servidor recusa mais de 2 MB, mas o proxy da VPS precisa deixar o corpo chegar até lá:

- Nginx: `client_max_body_size 3m;` (o padrão é 1 MB e devolveria 413 antes do app).
- Caddy: o padrão não limita; se definir `request_body { max_size 3MB }`, mantenha pelo menos 3 MB.

O Next.js bufferiza até 10 MB do corpo por causa do middleware. Entre 2 e 10 MB a rota responde 413 com mensagem clara,
mas de forma **intermitente** o próprio Next falha com 500 antes de a rota rodar (condição de corrida do framework,
observada na primeira requisição grande depois de subir o servidor). Acima de 10 MB o 500 é sistemático (comprovado com
um envio de 26 MB). Nos dois casos o arquivo é recusado e nada é gravado. O
formulário do admin já recusa arquivos acima de 2 MB no navegador, e o `client_max_body_size 3m` do proxy barra o resto;
recusar com 413 dentro do app exigiria uma checagem de `content-length` no `middleware.ts`, o que ficou para uma etapa autorizada.

### Backup

As fotos são só arquivos: inclua o volume no backup junto com o `pg_dump`. Restaurar o banco sem o volume deixa
`imageUrl` apontando para arquivos inexistentes (a página cai na imagem reserva).

## Testes

- Unitários (sem servidor): `npm test` (`tests/uploads.test.ts`).
- Ponta a ponta (servidor real, banco local, ALTERA e restaura um serviço da barbearia A): ver o cabeçalho de
  `tests/integration/uploads.ts` e `npm run test:uploads`.
- A suíte de isolamento (`npm run test:isolation`) cobre os endpoints de envio e remoção entre barbearias.

## Fora do escopo desta etapa

Foto de barbeiro, recorte no navegador, limpeza de arquivos órfãos por rotina e armazenamento em objeto (S3/Supabase).
