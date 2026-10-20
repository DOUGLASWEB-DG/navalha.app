# ADR-0004: Fotos em disco da VPS (volume), convertidas para WebP

- Status: Aceita
- Data: 2026-10-18

## Contexto

Serviços e barbeiros precisam de foto. O volume é pequeno (dezenas de fotos por barbearia) e a produção vai para uma
VPS própria.

## Decisão

- Arquivos em `UPLOADS_DIR` (volume Docker em `/data/uploads`), chave `<barbeariaId>/<services|avatars>/<uuid>.webp`.
- Toda foto é regravada (WebP, lado maior até 800 px, sem metadados). O banco guarda só a URL `/media/...`.
- Sem o volume montado e inicializado (marcador `.navalha-uploads`), o envio responde 503: nunca grava dentro do
  container.
- Só `ADMIN` envia; a leitura pública é restrita ao endereço da barbearia dona.

## Alternativas consideradas

- **Supabase Storage / S3:** sem dependência de disco, mas acrescenta serviço externo e custo; a produção deixa o
  Supabase.
- **Imagem no banco (bytea):** infla backups e o banco.

## Consequências

- O backup precisa incluir o volume junto com o `pg_dump`; trocar de servidor significa levar o volume.
- Limpeza de arquivos órfãos é dívida registrada.
- Escala horizontal exigiria armazenamento compartilhado (não é necessidade atual).
