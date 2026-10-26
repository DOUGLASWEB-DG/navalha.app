'use client'

import { useId } from 'react'
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarDays } from 'lucide-react'
import { CHART_AXIS_TICK, CHART_COLORS, formatAxisCurrency, formatMonthLabel } from '@/lib/chart'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MonthPoint {
  month: string
  monthFull: string
  receitas: number
  despesas: number
  saldo: number
}

export type PeriodMonths = 6 | 12

interface CashBalanceCardProps {
  /** Caixa: receitas menos despesas de todo o histórico */
  balance: number
  monthlyData: MonthPoint[]
  currentMonth: { income: number; expense: number; profit: number; profitMargin: number }
  /** Variação em % do mês atual contra o anterior */
  trends?: { income?: number; expense?: number }
  months: PeriodMonths
  onMonthsChange: (months: PeriodMonths) => void
}

const PERIODS: { value: PeriodMonths; label: string }[] = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
]

// "R$ 24.847,83" -> ["R$ 24.847", ",83"]: os centavos ficam apagados para o valor principal se destacar
function splitCents(value: number): [string, string] {
  const text = formatCurrency(value)
  const comma = text.lastIndexOf(',')
  return comma === -1 ? [text, ''] : [text.slice(0, comma), text.slice(comma)]
}

function indexOfMax(values: number[]): number {
  let best = -1
  values.forEach((v, i) => {
    if (v > 0 && (best === -1 || v > values[best])) best = i
  })
  return best
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload: MonthPoint }> }) {
  const first = payload?.[0]
  if (!active || !first) return null
  const point = first.payload
  return (
    <div className="min-w-44 rounded-xl border border-border bg-popover px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{formatMonthLabel(point.monthFull)}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: CHART_COLORS.receitas }} />
            Receitas
          </span>
          <span className="font-semibold tabular-nums text-foreground">{formatCurrency(point.receitas)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: CHART_COLORS.despesas }} />
            Despesas
          </span>
          <span className="font-semibold tabular-nums text-foreground">{formatCurrency(point.despesas)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-border pt-1.5">
          <span className="text-muted-foreground">Resultado</span>
          <span className={cn('font-semibold tabular-nums', point.saldo < 0 ? 'text-destructive' : 'text-foreground')}>
            {formatCurrency(point.saldo)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface DotProps {
  cx?: number
  cy?: number
  index?: number
}

export function CashBalanceCard({ balance, monthlyData, currentMonth, trends, months, onMonthsChange }: CashBalanceCardProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [whole, cents] = splitCents(balance)

  const bestIncome = indexOfMax(monthlyData.map((m) => m.receitas))
  const bestExpense = indexOfMax(monthlyData.map((m) => m.despesas))
  const first = monthlyData[0]
  const last = monthlyData[monthlyData.length - 1]
  const incomeTrend = trends?.income ?? 0

  // Ponto de destaque no maior valor de cada linha, como no gráfico de referência
  const highlight = (target: number, color: string) => {
    function Dot({ cx, cy, index }: DotProps) {
      if (index !== target || cx === undefined || cy === undefined) return <g key={index} />
      return <circle key={index} cx={cx} cy={cy} r={5} fill={color} stroke="hsl(var(--card))" strokeWidth={2.5} filter={`url(#dot-shadow-${uid})`} />
    }
    return Dot
  }

  return (
    <section aria-label="Caixa da barbearia" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Caixa da Barbearia</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className={cn('text-[34px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[46px]', balance < 0 && 'text-destructive')}>
              {whole}
              <span className="text-muted-foreground/60">{cents}</span>
            </span>
            {incomeTrend !== 0 && (
              <div className="flex flex-col items-start gap-1.5">
                <span
                  className={cn(
                    'inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium',
                    incomeTrend > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {incomeTrend > 0 ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
                  {Math.abs(incomeTrend).toFixed(1).replace('.', ',')}%
                </span>
                <span className="text-[11px] text-muted-foreground">Receitas vs mês anterior</span>
              </div>
            )}
          </div>
        </div>
        {first && last && (
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatMonthLabel(first.monthFull)} – {formatMonthLabel(last.monthFull)}
          </div>
        )}
      </div>

      <div className="mx-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-border py-4 text-xs sm:mx-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Lucro do mês</span>
          <span className={cn('ml-1 font-semibold tabular-nums', currentMonth.profit < 0 && 'text-destructive')}>{formatCurrency(currentMonth.profit)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
          {bestIncome >= 0 && (
            <span>
              Melhor mês <span className="ml-1 font-medium tabular-nums text-foreground">{formatCurrency(monthlyData[bestIncome].receitas)}</span>
              <span className="ml-1 opacity-70">({formatMonthLabel(monthlyData[bestIncome].month)})</span>
            </span>
          )}
          {bestExpense >= 0 && (
            <span>
              Maior gasto <span className="ml-1 font-medium tabular-nums text-foreground">{formatCurrency(monthlyData[bestExpense].despesas)}</span>
              <span className="ml-1 opacity-70">({formatMonthLabel(monthlyData[bestExpense].month)})</span>
            </span>
          )}
          <span>
            Margem <span className="ml-1 font-medium tabular-nums text-foreground">{currentMonth.profitMargin.toFixed(1).replace('.', ',')}%</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: CHART_COLORS.receitas }} />
            Receitas
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: CHART_COLORS.despesas }} />
            Despesas
          </span>
          <span className="font-normal text-muted-foreground">por mês</span>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Período do gráfico">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={months === p.value}
              onClick={() => onMonthsChange(p.value)}
              className={cn(
                'min-h-8 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                months === p.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4 pt-2 sm:px-5 sm:pb-6" role="img" aria-label={`Receitas e despesas por mês, de ${first ? formatMonthLabel(first.monthFull) : ''} a ${last ? formatMonthLabel(last.monthFull) : ''}`}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyData} margin={{ top: 24, right: 18, left: 0, bottom: 8 }}>
            <defs>
              <pattern id={`dot-grid-${uid}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="9" cy="9" r="0.7" fill="hsl(var(--border))" />
              </pattern>
              {/* Sombra só neutra, nos pontos de destaque. Nas linhas o filtro escondia o traço, por isso não há */}
              <filter id={`dot-shadow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.22" />
              </filter>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill={`url(#dot-grid-${uid})`} pointerEvents="none" />
            <CartesianGrid strokeDasharray="4 7" stroke="hsl(var(--border))" horizontal vertical={false} />
            {last && <ReferenceLine x={last.month} stroke={CHART_COLORS.receitas} strokeDasharray="4 5" strokeOpacity={0.35} />}
            <XAxis dataKey="month" tick={CHART_AXIS_TICK} tickFormatter={formatMonthLabel} axisLine={false} tickLine={false} tickMargin={14} interval="preserveStartEnd" minTickGap={24} />
            <YAxis width={68} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} tickMargin={10} tickFormatter={formatAxisCurrency} />
            <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 4', stroke: CHART_COLORS.receitas, strokeOpacity: 0.5 }} />
            <Line
              type="monotone"
              dataKey="receitas"
              name="Receitas"
              stroke={CHART_COLORS.receitas}
              strokeWidth={2.5}
              dot={highlight(bestIncome, CHART_COLORS.receitas)}
              activeDot={{ r: 6, fill: CHART_COLORS.receitas, stroke: 'hsl(var(--card))', strokeWidth: 3 }}
              animationBegin={120}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke={CHART_COLORS.despesas}
              strokeWidth={2.5}
              dot={highlight(bestExpense, CHART_COLORS.despesas)}
              activeDot={{ r: 6, fill: CHART_COLORS.despesas, stroke: 'hsl(var(--card))', strokeWidth: 3 }}
              animationBegin={240}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3.5 text-[11px] text-muted-foreground sm:px-8">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ background: CHART_COLORS.receitas }} />
          {monthlyData.length} meses de movimento
        </span>
        <span>Os pontos marcam o melhor mês de receita e o maior gasto</span>
      </div>
    </section>
  )
}
