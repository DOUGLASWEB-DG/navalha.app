# Fotos de serviço e de barbeiro (uploads)

Estado: o admin envia a foto de um serviço (Serviços > Editar serviço) e a de um barbeiro/admin (Equipe > Editar).
As duas aparecem na página de agendamento (`/book`); a do barbeiro também no card da Equipe. Só o ADMIN troca fotos.
Deploy na VPS (volume, init no Docker, backup): `docs/deploy.md`.

## Como funciona

| Peça | Arquivo |
|---|---|
| Validação e conversão (JPEG/PNG/WebP, 15 MB, 60 MP, saída WebP até 800 px, sem EXIF/GPS) | `lib/uploads/image.ts` |
| Gravação no disco, chave `<barbeariaId>/<services\|avatars>/<uuid>.webp`, marcador do volume | `lib/uploads/storage.ts` |
| Recebimento do arquivo e troca segura (comum às duas rotas) | `lib/uploads/route-helpers.ts` |
| Envio e remoção (somente ADMIN da barbearia) | `app/api/services/[id]/image/route.ts`, `app/api/users/[id]/avatar/route.ts` |
| Leitura pública | `app/media/[...key]/route.ts` |
| Campo de foto dos formulários | `components/shared/photo-field.tsx` |

- O banco guarda só a URL pública (`Service.imageUrl` / `User.avatarUrl` = `/media/<chave>`); o cliente nunca informa o caminho.
- Excluir o serviço ou o usuário apaga a foto do disco.
- Cada troca de foto gera um UUID novo, por isso a URL pode ficar em cache para sempre (`immutable`).
- A rota `/media` só entrega a foto ao Host da barbearia dona dela. O matcher do middleware ignora URLs `.webp`,
  então a rota confere o tenant sozinha.
- `getServiceImage` em `app/book/page.tsx` continua como reserva para serviço sem foto; barbeiro sem foto (ou com
  arquivo que não carrega) mostra o ícone.

## Configuração por servidor

1. Defina `UPLOADS_DIR`. Em produção precisa ser caminho **absoluto** de um volume persistente (ex.: `/data/uploads`).
2. Uma vez por volume: `npm run uploads:init` (cria a pasta e o arquivo `.navalha-uploads`).
3. Sem a variável, sem a pasta ou sem o marcador, o envio responde **503** e nada é gravado. Isso evita gravar
   dentro do container (as fotos sumiriam no próximo deploy).

### Docker

Monte o volume em `UPLOADS_DIR` (a imagem já define `/data/uploads`) e inicialize o volume uma vez. A imagem final
não tem `npm run`/`tsx`: o comando equivalente ao `uploads:init` está em `docs/deploy.md`. O usuário do container
(`nextjs`, uid 1001) precisa de permissão de escrita na pasta do volume; volume nomeado novo já herda esse dono.

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

O servidor recusa mais de 15 MB (`lib/uploads/limits.ts`; fotos de celular de 12 a 50 MP têm de 3 a 15 MB), mas o
proxy da VPS precisa deixar o corpo chegar até lá:

- Nginx: `client_max_body_size 16m;` (o padrão é 1 MB e devolveria 413 antes do app).
- Caddy: o padrão não limita; defina `request_body { max_size 16MiB }` (com `MB` o Caddy conta 1.000.000 bytes).

As duas rotas de envio (`api/services/<id>/image` e `api/users/<id>/avatar`) ficam **fora do matcher do middleware**.
No Next 15.5 o middleware em Node.js bufferiza o corpo e, de forma intermitente, corrompia envios acima de ~100 KB
("Response body object should not be disturbed or locked": 500 em ~25% dos envios, medido em 2026-10-19); fora do
middleware foram 0 falhas em 100. Isso é seguro porque os handlers resolvem a barbearia pelo próprio Host
(`getCurrentBarbearia`) e exigem `requireTenantAdmin`; o middleware não injeta cabeçalho de tenant que pudesse ser
forjado. A suíte de isolamento cobre as 4 rotas+métodos. Efeito colateral: o envio de foto não renova a sessão.
`experimental.middlewareClientMaxBodySize` (16 MB, `next.config.js`) continua acima do limite para as demais rotas.

Ao mudar `MAX_UPLOAD_BYTES`, ajuste junto o `next.config.js` e o proxy; os dois precisam ficar acima dele.

### Backup

As fotos são só arquivos: inclua o volume no backup junto com o `pg_dump` (comandos e mudança de servidor em
`docs/deploy.md`). Restaurar o banco sem o volume deixa as URLs apontando para arquivos inexistentes (serviço cai na
imagem reserva, barbeiro no ícone).

## Testes

- Unitários (sem servidor): `npm test` (`tests/uploads.test.ts`).
- Ponta a ponta (servidor real, banco local, ALTERA e restaura um serviço e um barbeiro da barbearia A, e cria um
  usuário temporário): ver o cabeçalho de `tests/integration/uploads.ts` e `npm run test:uploads`.
- A suíte de isolamento (`npm run test:isolation`) cobre os endpoints de envio e remoção entre barbearias.

## Fora do escopo desta etapa

Recorte no navegador, o próprio barbeiro trocar a foto, limpeza de arquivos órfãos por rotina (dívida registrada em
`docs/deploy.md`) e armazenamento em objeto (S3/Supabase).
