'use client'

interface ChartDataPoint {
  day: string
  income: number
  expense: number
}

interface RevenueChartProps {
  data: ChartDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Visão de Receita</h3>
        <p className="text-xs text-muted-foreground mt-1">Sem dados disponíveis</p>
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1
  )

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Visão de Receita</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Receitas vs despesas dos últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Despesa</span>
          </div>
        </div>
      </div>

 {/* Gráfico de barras simples */}
<div className="flex items-end gap-3 h-48 w-full mt-4 px-2">
  {data.map((point, index) => {
    const incomeHeight = maxValue > 0 ? (point.income / maxValue) * 100 : 0;
    const expenseHeight = maxValue > 0 ? (point.expense / maxValue) * 100 : 0;

    return (
      <div key={index} className="flex-1 flex flex-col items-center h-full group">
        <div className="relative w-full flex-1 flex items-end justify-center gap-1.5">
          
          {/* Barra de Receita */}
          <div
            className="w-full max-w-[14px] rounded-t-sm transition-all duration-500 hover:brightness-125 relative"
            style={{ 
              height: `${Math.max(incomeHeight, 2)}%`,
              backgroundColor: 'hsl(var(--primary))' 
            }}
          >
            {/* Valor fixo em cima da barra */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-primary font-bold whitespace-nowrap">
              {point.income > 0 ? `R$${point.income}` : ''}
            </span>
          </div>

          {/* Barra de Despesa */}
          <div
            className="w-full max-w-[14px] rounded-t-sm transition-all duration-500 hover:brightness-125 relative"
            style={{ 
              height: `${Math.max(expenseHeight, 2)}%`,
              backgroundColor: 'hsl(var(--destructive))'
            }}
          >
            {/* Valor fixo em cima da barra */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-destructive font-bold whitespace-nowrap">
              {point.expense > 0 ? `R$${point.expense}` : ''}
            </span>
          </div>

        </div>
        
        <span className="text-[10px] text-zinc-500 mt-4 font-bold uppercase">
          {point.day}
        </span>
      </div>
    )
  })}
</div>

      {/* Resumo */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Receitas</p>
          <p className="text-sm font-bold text-primary">
            R${data.reduce((sum, d) => sum + d.income, 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Despesas</p>
          <p className="text-sm font-bold text-destructive">
            R${data.reduce((sum, d) => sum + d.expense, 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className="text-sm font-bold text-success">
            R${(data.reduce((sum, d) => sum + d.income, 0) - data.reduce((sum, d) => sum + d.expense, 0)).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
