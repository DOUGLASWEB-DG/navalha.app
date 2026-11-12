# Permissões da equipe
O administrador configura o padrão dos barbeiros em Equipe → Permissões da equipe.
Na edição do profissional, cada ação pode herdar o grupo, ser permitida ou ser bloqueada.

## Escopo desta etapa
- Cadastrar, editar, confirmar, concluir e cancelar agendamentos próprios.
- Cadastrar clientes.
- Leitura da própria agenda permanece disponível.
- As permissões não promovem o profissional a administrador, não liberam o caixa e não eliminam as regras de horário, conflito ou isolamento entre barbearias.
- Só administradores modificam o grupo e as exceções.
- O servidor consulta os valores atuais em cada ação; não depende de renovar o JWT.
- Configurações vazias preservam as permissões anteriores.
- Migração aditiva: 20261111150000_team_permissions. Aplicar primeiro no banco local e na demo, após backup.
- A volta da imagem é compatível com as duas colunas novas; não remover colunas para fazer rollback.

## Futuro
Pacotes e mudanças na base de cálculo da comissão não fazem parte desta etapa.
Planejamento do pacote: distinguir compra, reserva de horário, execução do serviço e comissão.
O preço promocional da venda não define automaticamente a base da comissão.
Ainda dependem de decisão: atendimento imediato sem reserva, serviços cobertos e política de preço-base.
