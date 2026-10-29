# Instalação de cliente (app e banco próprios)

Como colocar uma barbearia nova no ar **sem tocar na América nem na demo**. Cada cliente ganha o seu próprio `app` e o seu
próprio banco Postgres, com segredos próprios, fotos próprias, backup próprio e o plano dele (`NAVALHA_PLANO`).

## Por que uma instalação por cliente

- **WhatsApp:** cada instalação usa a própria instância da Evolution (`EVO_INSTANCE_NAME`) e só a barbearia dela a controla
  (`WHATSAPP_BARBEARIA_ID`); sem as duas variáveis vale a da América (`lib/whatsapp-config.ts`). Combinação incoerente é erro
  (falha fechada). O cliente novo nasce **sem** `EVO_*` e, no Essencial, o `sendTextMessage` também não envia (`lib/plan.ts`).
- **Dados:** banco separado. Um erro de isolamento num cliente não alcança os dados de outro.
- **Plano:** `NAVALHA_PLANO=essencial` esconde e barra Finanças, Metas e Produtos e limita a 2 barbeiros. Sem a variável
  (América e demo) o plano é completo e nada muda.

## Antes de começar

1. **DNS:** crie o registro `A` de `<slug>.navalhaapp.tech` apontando para `2.24.117.253` (não há DNS curinga).
2. **Imagens na VPS:** `navalha-app:<tag>` e `navalha-migrate:<tag>` (`docker build --target builder`), enviadas com
   `docker save | gzip | ssh root@... 'gunzip | docker load'`.
3. **Hash da senha do proprietário**, gerado no PC (a senha em texto nunca vai ao servidor):
   `node -e "console.log(require('bcryptjs').hashSync('SENHA-AQUI',10))"`

## Passo a passo (na VPS, de `/opt/navalha`)

1. `bash /root/instancia-cliente/criar-instancia.sh <slug> <essencial|completo> <tag>`: gera `.env`, compose, backup e cron.
   Ao final imprime os comandos seguintes já com o nome preenchido. Se algum arquivo já existir, aborta sem alterar nada.
2. Subir o banco, esperar `healthy`, aplicar as migrations (`prisma migrate deploy`).
3. Criar a barbearia e o proprietário: `scripts/criar-barbearia.ts` dentro da imagem `navalha-migrate`. A trava aborta se o
   banco não for `navalha_<slug>`, então nunca escreve no da América nem no da demo. Ele também **desativa** a barbearia
   padrão "América" que a migration cria em todo banco novo.
4. Inicializar o volume de fotos e subir o app.
5. `bash /root/instancia-cliente/caddy-instancia.sh <slug>`: acrescenta o bloco ao Caddyfile, **valida antes**, faz cópia e
   recarrega; se falhar, devolve o Caddyfile anterior.
6. Rodar o backup uma vez à mão e o teste de restauração. **Só entregue o acesso depois que a restauração conferir.**

Use sempre os dois arquivos no compose: `docker compose -f compose.yml -f compose.<slug>.yml <comando>`. O `docker compose`
normal (só `compose.yml`) continua cuidando da América e avisa de "orphan containers", o que é esperado e inofensivo. Não use
`--remove-orphans` nele.

## Backup

- Diário às 07:10 UTC (o da América é 07:00) em `/opt/navalha/backup/<slug>/`, com 14 dias de histórico, checksum e atalho
  `ultimo`. Teste de restauração aos domingos, 07:50 UTC. Log: `/var/log/navalha-backup.log`.
- Fica **na própria VPS**. Copie para fora de vez em quando:
  `scp -r root@2.24.117.253:/opt/navalha/backup/<slug>/ultimo C:\Backups\navalha\<slug>\`

## Mudar o plano depois

Edite `NAVALHA_PLANO` no `<slug>.env` e recrie só o app: `docker compose -f compose.yml -f compose.<slug>.yml up -d <slug>-app`.
Nada se perde: concluir um atendimento sempre lançou a receita, mesmo no Essencial, então o histórico financeiro já estará lá.
Ao passar para o Completo, a tela de Finanças volta com os dados.

## O que esta instalação NÃO tem (de propósito)

- WhatsApp e robô de lembretes (só no plano Completo, e só depois de combinado). Para ligar:
  1. na VPS, criar a instância da Evolution do cliente **com token próprio** (o app do cliente usa só esse token em `EVO_API_KEY`,
     nunca a chave geral);
  2. no `<slug>.env`: `NEXT_PUBLIC_EVO_URL`, `EVO_API_KEY` (token da instância), `EVO_INSTANCE_NAME=<slug>` e
     `WHATSAPP_BARBEARIA_ID=barbearia-<slug>`, depois `NAVALHA_PLANO=completo`;
  3. acrescentar o serviço `<slug>-cron` ao `compose.<slug>.yml` (mesma imagem, `command: node cron.js`, mesmo `env_file`);
  4. conectar o QR pelo painel do cliente (Configurações → WhatsApp) e testar com um número de teste antes de liberar.
  Ainda **a confirmar** no Evolution v2.3.7: que o token da instância não alcança outras instâncias.
- Reset diário (a demo reseta, o cliente real **não**).
