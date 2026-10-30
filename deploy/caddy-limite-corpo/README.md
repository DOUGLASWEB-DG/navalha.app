# Limite de corpo no Caddy

Antes: o Caddy aceita corpo de até **16 MiB em qualquer rota**. Só as fotos precisam disso; um agendamento ou um login cabe em poucos KB.
Depois: `/api/*` aceita no máximo **64 KB**, exceto `/api/services/*/image` e `/api/users/*/avatar` (fotos), que seguem com 16 MiB.
Os dois `request_body` convivem: para as rotas pequenas vale o menor.

Testado antes com um Caddy 2.10 real: 10 KB em `/api/book` passa; 100 KB em `/api/book`, `/api/auth/login` e `/api/clients` recebem 413;
foto de 5 MB passa nas duas rotas de foto; 17 MB nas rotas de foto recebe 413; 100 KB fora de `/api` passa.

Aplicar (na VPS, como root):

    mkdir -p /tmp/caddy-limite && cd /tmp/caddy-limite   # copie aplicar.sh e patch-caddy.py para esta pasta
    bash aplicar.sh

Se aparecer rota nova de upload (outra foto), acrescente o caminho dela na linha `not path` de `patch-caddy.py` ANTES de aplicar,
senão o upload passa a ser recusado com 413.
