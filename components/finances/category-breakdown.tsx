'use client'

import { formatCurrency } from '@/lib/format'

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

export function CategoryBreakdown({
  data,
  title = 'Despesas por Categoria',
  subtitle = 'Mês atual',
  maxItems = 6,
}: CategoryBreakdownProps) {
  const items = data.slice(0, maxItems)
  const total = items.reduce((s, c) => s + c.value, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
          Sem dados ainda
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((cat, i) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cat.color }}
                    />
                    {cat.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(cat.value)} — {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
