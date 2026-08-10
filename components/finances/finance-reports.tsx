'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { CategoryBreakdown } from './category-breakdown'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-semibold text-zinc-100">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const periods = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
]

export function FinanceReports() {
  const [period, setPeriod] = useState(6)
  const { data, isLoading } = useSWR(`/api/finances/reports?period=${period}`, fetcher)

  async function handleExport() {
    const res = await fetch(`/api/finances/export?period=${period}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-${period}meses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <ReportsSkeleton />
  if (!data) return null

  const { monthlyData, netWorthData, categoryBreakdown, totals } = data
  const balance = totals?.balance ?? 0

  return (
    <div className="space-y-6 duration-500 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/90 p-1 touch-pan-x backdrop-blur-sm">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'min-h-12 shrink-0 snap-start rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                period === p.value
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 active:bg-white/5'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="gap-2 border-white/10 text-foreground transition-all active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Totais — grid alinhado, valores grandes e cores vibrantes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-sm backdrop-blur-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Total de receitas</p>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-emerald-400">
            {formatCurrency(totals?.income ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-sm backdrop-blur-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/35 bg-red-500/15">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Total de despesas</p>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-red-400">
            {formatCurrency(totals?.expense ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-sm backdrop-blur-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                balance >= 0
                  ? 'border-amber-400/35 bg-amber-500/15'
                  : 'border-red-400/35 bg-red-500/15'
              )}
            >
              <DollarSign
                className={cn('h-6 w-6', balance >= 0 ? 'text-amber-400' : 'text-red-400')}
              />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Saldo periódico</p>
          </div>
          <p
            className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              balance >= 0 ? 'text-amber-400' : 'text-red-400'
            )}
          >
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 backdrop-blur-sm">
        <p className="mb-1 text-sm font-semibold text-foreground">Receitas × Despesas</p>
        <p className="mb-5 text-xs text-zinc-500">Comparativo mensal — últimos {period} meses</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData ?? []} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
            <Bar dataKey="receitas" name="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 backdrop-blur-sm">
          <p className="mb-1 text-sm font-semibold text-foreground">Evolução do Patrimônio</p>
          <p className="mb-5 text-xs text-zinc-500">Saldo acumulado ao longo do tempo</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={netWorthData ?? []} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="patrimonio"
                name="Patrimônio"
                stroke="#fbbf24"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#fbbf24' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <CategoryBreakdown
            data={categoryBreakdown ?? []}
            title="Gastos por Categoria"
            subtitle={`Últimos ${period} meses`}
          />

          {categoryBreakdown && categoryBreakdown.length > 0 && (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/90 p-5 backdrop-blur-sm">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  )
}
