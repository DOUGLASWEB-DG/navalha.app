// Estrutura da documentação do produto (/produto): capítulos e seções, na ordem em que aparecem.
// É a única fonte da numeração (1, 1.1, 1.2...) e do sumário: a página, o menu lateral e o sumário leem daqui, então a
// ordem e os números nunca divergem. Função pura: os testes conferem ids únicos e a numeração sem banco.
// Para incluir uma seção: acrescente aqui, na posição certa, e escreva o conteúdo em app/produto/page.tsx com o mesmo id.

export type SecaoDoc = { id: string; titulo: string }
export type CapituloDoc = { id: string; titulo: string; secoes: SecaoDoc[] }

export const CAPITULOS: readonly CapituloDoc[] = [
  {
    id: 'apresentacao',
    titulo: 'Apresentação do sistema',
    secoes: [
      { id: 'visao-geral', titulo: 'Visão geral' },
      { id: 'perfis', titulo: 'Perfis de acesso' },
      { id: 'planos', titulo: 'Planos e recursos' },
    ],
  },
  {
    id: 'instalacao',
    titulo: 'Atalho no celular e no computador',
    secoes: [
      { id: 'como-funciona-atalho', titulo: 'Como funciona o atalho' },
      { id: 'android', titulo: 'Android (Chrome)' },
      { id: 'iphone', titulo: 'iPhone e iPad (Safari)' },
      { id: 'computador', titulo: 'Computador (Chrome e Edge)' },
      { id: 'atalho-problemas', titulo: 'Remoção e problemas comuns' },
    ],
  },
  {
    id: 'comecando',
    titulo: 'Primeiros passos',
    secoes: [{ id: 'primeiros-passos', titulo: 'Entrar e percorrer a demonstração' }],
  },
  {
    id: 'cliente',
    titulo: 'Para o cliente',
    secoes: [
      { id: 'agendamento-online', titulo: 'Agendamento online' },
      { id: 'pagina-profissional', titulo: 'Página do profissional' },
    ],
  },
  {
    id: 'proprietario',
    titulo: 'Painel do proprietário',
    secoes: [
      { id: 'painel', titulo: 'Painel do dia' },
      { id: 'agendamentos', titulo: 'Agendamentos' },
      { id: 'clientes', titulo: 'Clientes' },
      { id: 'servicos', titulo: 'Serviços' },
      { id: 'equipe', titulo: 'Equipe e permissões' },
      { id: 'financas', titulo: 'Finanças' },
      { id: 'metas', titulo: 'Metas' },
      { id: 'produtos', titulo: 'Produtos' },
    ],
  },
  {
    id: 'barbeiro',
    titulo: 'Para o barbeiro',
    secoes: [{ id: 'rotina-barbeiro', titulo: 'Rotina diária' }],
  },
  {
    id: 'automacao',
    titulo: 'Automação',
    secoes: [{ id: 'whatsapp', titulo: 'Lembretes no WhatsApp' }],
  },
  {
    id: 'referencia',
    titulo: 'Regras e referência',
    secoes: [
      { id: 'regras', titulo: 'Regras da agenda' },
      { id: 'status', titulo: 'Status do agendamento' },
      { id: 'seguranca', titulo: 'Segurança e dados' },
      { id: 'faq', titulo: 'Perguntas frequentes' },
    ],
  },
  {
    id: 'glossario',
    titulo: 'Glossário',
    secoes: [{ id: 'termos', titulo: 'Termos usados neste manual' }],
  },
]

export type ItemDoSumario = { id: string; numero: string; titulo: string; nivel: 1 | 2 }

// Lista plana, na ordem de leitura: capítulo ("1") seguido das suas seções ("1.1", "1.2"...).
export function itensDoSumario(capitulos: readonly CapituloDoc[] = CAPITULOS): ItemDoSumario[] {
  const itens: ItemDoSumario[] = []
  capitulos.forEach((cap, i) => {
    const n = i + 1
    itens.push({ id: cap.id, numero: String(n), titulo: cap.titulo, nivel: 1 })
    cap.secoes.forEach((sec, j) => itens.push({ id: sec.id, numero: `${n}.${j + 1}`, titulo: sec.titulo, nivel: 2 }))
  })
  return itens
}

export function numeroDe(id: string, capitulos: readonly CapituloDoc[] = CAPITULOS): string | null {
  return itensDoSumario(capitulos).find((item) => item.id === id)?.numero ?? null
}

export function tituloDe(id: string, capitulos: readonly CapituloDoc[] = CAPITULOS): string | null {
  return itensDoSumario(capitulos).find((item) => item.id === id)?.titulo ?? null
}
