# ADR-0003: Datas calculadas no fuso IANA da barbearia

- Status: Aceita
- Data: 2026-10-18

## Contexto

A América fica em Porto Velho (UTC-4). O servidor roda em UTC e os aparelhos dos usuários podem estar em qualquer fuso.
Foi comprovado que um horário digitado num aparelho em São Paulo era gravado uma hora antes, e que lançamentos às
23:30 caíam no dia ou mês seguinte nos relatórios.

## Decisão

- `Barbearia.timezone` (IANA, ex.: `America/Porto_Velho`).
- Limites de dia, semana e mês (painel, financeiro, metas, disponibilidade) calculados no fuso da barbearia
  (`lib/time-zone.ts`); as regras de agendamento exigem o fuso como parâmetro.
- As telas recebem o fuso por `/api/auth/me` e formatam datas nele, independentemente do aparelho.
- Formulários enviam horário de parede (`yyyy-MM-ddTHH:mm`, sem `Z`); o servidor converte.

## Alternativas consideradas

- **Fuso fixo no servidor (`TZ`):** quebraria com uma segunda barbearia em outro fuso.
- **Fuso do aparelho:** é exatamente o erro observado.

## Consequências

- O banco continua em UTC; a conversão é sempre explícita.
- Testado com o servidor em UTC e o navegador em São Paulo, Tóquio e Porto Velho.
- Dados antigos gravados à meia-noite UTC podem aparecer um dia antes; a correção depende de consulta autorizada em
  produção.
