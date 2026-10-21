// Cores e formatação dos gráficos financeiros (Recharts).
//
// Receitas x despesas em azul x vermelho: o par passa nas checagens de daltonismo do validador de paleta
// (pior par na simulação: ΔE 21,6; verde x vermelho ficava em 6,9, no limite). Decisão de 2026-10-21.
// Texto nunca usa a cor da série: valores e rótulos ficam nas cores de texto do tema.
export const CHART_COLORS = {
  receitas: '#2a78d6',
  despesas: '#e34948',
  saldo: '#104281',
} as const

// Grade e eixos discretos (tokens do tema)
export const CHART_GRID = 'hsl(var(--border))'
export const CHART_AXIS_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Eixo em reais que o barbeiro lê: R$ 0, R$ 150, R$ 1,5 mil, R$ 1,2 mi (antes: "R$0k" para tudo abaixo de mil)
export function formatAxisCurrency(value: number): string {
  return compactCurrency.format(value)
}

// "out. de 26" -> "out/26"; "mai." -> "mai"
export function formatMonthLabel(label: string): string {
  return String(label ?? '').replace(/\./g, '').replace(' de ', '/')
}

// As categorias padrão foram gravadas com cores saturadas (paleta "tech"). Na tela, cada uma é trocada pelo tom
// sóbrio equivalente, sem alterar o banco. Cor desconhecida passa como está.
const SOBER_CATEGORY_COLORS: Record<string, string> = {
  '#00c896': '#1baf7a',
  '#10b981': '#008300',
  '#3b82f6': '#2a78d6',
  '#06b6d4': '#256abf',
  '#f59e0b': '#c98500',
  '#8b5cf6': '#6250d6',
  '#ef4444': '#e34948',
  '#6b7280': '#898781',
}

export function categoryColor(color: string | null | undefined): string {
  if (!color) return SOBER_CATEGORY_COLORS['#6b7280']
  return SOBER_CATEGORY_COLORS[color.toLowerCase()] ?? color
}
