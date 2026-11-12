# Pacotes: fluxo proposto, ainda não implementado
Atualizado em 2026-11-12 com os pedidos do Douglas.

## O que foi confirmado no código
- Concluir um agendamento vinculado a um pacote ativo já incrementa usedCuts.
- O atalho use_cut apenas baixa o contador; não registra um atendimento nem gera comissão.
- A comissão de pacote ainda usa preço do modelo dividido pela quantidade de cortes. Isso não atende à proposta de comissão sobre o preço normal do serviço.
- Modelo do pacote e compra do cliente são entidades distintas; a compra não equivale a um horário reservado.

## Caminho recomendado
1. Na cartela, oferecer “Agendar corte” e, se aprovado, “Atender agora”.
2. Pré-selecionar cliente e pacote, confirmar o serviço coberto e identificar quem atende.
3. Fazer a baixa ao concluir o atendimento, uma única vez, junto do registro da comissão.
4. Não cobrar novamente o serviço pré-pago. Serviços extras devem ser discriminados.
5. Ajuste manual de saldo, se existir, deve ser separado do atendimento, restrito ao administrador e conter motivo.
6. Guardar o preço da compra e a base da comissão como histórico, sem recalcular atendimentos antigos quando o modelo ou o serviço mudar.
7. Comissões sobre preço normal, preço-base do serviço e momento de congelamento ainda dependem da decisão final do Douglas.

## Validações necessárias antes de liberar
- Pacote pertence ao cliente e à barbearia, está válido, tem saldo e cobre o serviço.
- Respeitar vínculo com profissional e reservas já existentes.
- Finalização e consumo precisam ocorrer na mesma transação, com proteção contra cliques e pedidos simultâneos.
- Pacote inválido não deve virar atendimento avulso cobrado silenciosamente.
- Cancelamento, reabertura e estorno precisam manter saldo e comissão coerentes.
- Não depender da interface para aplicar as restrições.
