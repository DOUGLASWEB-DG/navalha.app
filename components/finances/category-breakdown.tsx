'use client'

import { formatCurrency } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart'

interface CategoryItem {
  id: string | null
  name: string
  color: string
  value: number
}

interface CategoryBreakdownProps {
  data: CategoryItem[]
  title?: string
  subtitle?: string
  maxItems?: number
}

// Gastos por categoria em barras ordenadas (no lugar da pizza): uma cor só, nome, valor e % escritos em cada linha.
// As maiores categorias aparecem; o resto soma em "Outros". A % é sobre o total gasto, não só sobre as exibidas.
export function CategoryBreakdown({
  data,
  title = 'Onde você mais gastou',
  subtitle = 'Mês atual',
  maxItems = 5,
}: CategoryBreakdownProps) {
  const sorted = [...data].filter((c) => c.value > 0).sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, c) => s + c.value, 0)
  const top = sorted.slice(0, maxItems)
  const rest = sorted.slice(maxItems).reduce((s, c) => s + c.value, 0)
  const rows = rest > 0 ? [...top, { id: null, name: 'Outros', color: '', value: rest }] : top
  const largest = rows.reduce((m, c) => Math.max(m, c.value), 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
          Nenhum gasto registrado no período
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((cat) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0
            // Largura relativa à maior categoria: a primeira barra ocupa a linha toda e as outras se comparam a ela
            const width = largest > 0 ? Math.max(2, (cat.value / largest) * 100) : 0
            return (
              <li key={cat.id ?? cat.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{cat.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatCurrency(cat.value)}</span>
                    {' · '}
                    {pct.toLocaleString('pt-BR', { maximumFractionDigits: pct < 10 ? 1 : 0 })}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${width}%`, background: CHART_COLORS.despesas }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
