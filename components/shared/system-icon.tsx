import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/utils'

// Semantic names shared by fields, dialogs, tables and actions.
// Source artwork and categories: public/assets/icons/catalogo.json.
const sources = {
  "inicio-painel": "/assets/icons/navegacao-painel/inicio-painel.png",
  "buscar": "/assets/icons/navegacao-painel/buscar.png",
  "notificacoes": "/assets/icons/navegacao-painel/notificacoes.png",
  "whatsapp": "/assets/icons/navegacao-painel/whatsapp.png",
  "relatorios": "/assets/icons/navegacao-painel/relatorios.png",
  "agenda-horarios": "/assets/icons/agenda-atendimento/agenda-horarios.png",
  "novo-agendamento": "/assets/icons/agenda-atendimento/novo-agendamento.png",
  "lista-de-espera": "/assets/icons/agenda-atendimento/lista-de-espera.png",
  "horarios-e-folgas": "/assets/icons/agenda-atendimento/horarios-e-folgas.png",
  "bloqueios-de-agenda": "/assets/icons/agenda-atendimento/bloqueios-de-agenda.png",
  "confirmados": "/assets/icons/agenda-atendimento/confirmados.png",
  "concluidos": "/assets/icons/agenda-atendimento/concluidos.png",
  "pendentes": "/assets/icons/agenda-atendimento/pendentes.png",
  "pendentes-dinheiro": "/assets/icons/agenda-atendimento/pendentes-dinheiro.png",
  "lista-de-clientes": "/assets/icons/clientes-equipe/lista-de-clientes.png",
  "total-de-clientes": "/assets/icons/clientes-equipe/total-de-clientes.png",
  "total-grupo": "/assets/icons/clientes-equipe/total-grupo.png",
  "clientes": "/assets/icons/clientes-equipe/clientes.png",
  "equipe": "/assets/icons/clientes-equipe/equipe.png",
  "perfil-da-barbearia": "/assets/icons/clientes-equipe/perfil-da-barbearia.png",
  "servicos-tesoura": "/assets/icons/servicos-produtos/servicos-tesoura.png",
  "produtos-estoque": "/assets/icons/servicos-produtos/produtos-estoque.png",
  "financeiro-caixa": "/assets/icons/financeiro/financeiro-caixa.png",
  "despesas": "/assets/icons/financeiro/despesas.png",
  "lucro-liquido": "/assets/icons/financeiro/lucro-liquido.png",
  "receita": "/assets/icons/financeiro/receita.png",
  "receita-alt": "/assets/icons/financeiro/receita-alt.png",
  "faturamento": "/assets/icons/financeiro/faturamento.png",
  "faturamento-do-dia": "/assets/icons/financeiro/faturamento-do-dia.png",
  "comissoes": "/assets/icons/financeiro/comissoes.png",
  "formas-de-pagamento": "/assets/icons/financeiro/formas-de-pagamento.png",
  "metas-desempenho": "/assets/icons/desempenho-relacionamento/metas-desempenho.png",
  "clube-de-assinatura-vip": "/assets/icons/desempenho-relacionamento/clube-de-assinatura-vip.png",
  "configuracoes-ajustes": "/assets/icons/configuracoes/configuracoes-ajustes.png"
} as const

export type SystemIconName = keyof typeof sources

export function SystemIcon({ name, className }: { name: SystemIconName; className?: string }) {
  return <AppIcon src={sources[name]} className={cn('h-5 w-5', className)} />
}
