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
import { apiFetcher } from '@/lib/http-errors'

const fetcher = apiFetcher

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
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
        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 touch-pan-x">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'min-h-12 shrink-0 snap-start rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                period === p.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground active:bg-muted'
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
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">Total de receitas</p>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-success">
            {formatCurrency(totals?.income ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">Total de despesas</p>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-destructive">
            {formatCurrency(totals?.expense ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                balance >= 0
                  ? 'border-primary/20 bg-primary/10'
                  : 'border-destructive/20 bg-destructive/10'
              )}
            >
              <DollarSign
                className={cn('h-6 w-6', balance >= 0 ? 'text-primary' : 'text-destructive')}
              />
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">Saldo periódico</p>
          </div>
          <p
            className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              balance >= 0 ? 'text-primary' : 'text-destructive'
            )}
          >
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-foreground">Receitas × Despesas</p>
        <p className="mb-5 text-xs text-muted-foreground">Comparativo mensal — últimos {period} meses</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData ?? []} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-foreground">Evolução do Patrimônio</p>
          <p className="mb-5 text-xs text-muted-foreground">Saldo acumulado ao longo do tempo</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={netWorthData ?? []} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="patrimonio"
                name="Patrimônio"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'hsl(var(--chart-1))' }}
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
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-5 shadow-sm">
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      {/* Fake Bar Chart */}
      <div className="h-72 rounded-2xl border border-border bg-card p-5 flex flex-col justify-end gap-2">
        <div className="flex items-end justify-around h-48 w-full">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-1 items-end h-full w-12">
              <Skeleton className="w-full rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
              <Skeleton className="w-full rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  )
}
