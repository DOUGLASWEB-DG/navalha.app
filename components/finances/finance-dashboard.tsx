'use client'

import useSWR from 'swr'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { CategoryBreakdown } from './category-breakdown'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanceDashboard() {
  const { data, isLoading } = useSWR('/api/finances/stats?months=6', fetcher)

  if (isLoading) return <FinanceDashboardSkeleton />
  if (!data) return null

  const { currentMonth, trends, monthlyData, categoryBreakdown, allTime } = data
  const profit = currentMonth?.profit ?? 0
  const profitMargin = currentMonth?.profitMargin ?? 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Card — Caixa do Negócio */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium opacity-80">Caixa da Barbearia</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(allTime?.balance ?? 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] opacity-70 mb-1 uppercase">Receita Mês</p>
              <p className="text-base font-bold">{formatCurrency(currentMonth?.income ?? 0)}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] opacity-70 mb-1 uppercase">Despesas Mês</p>
              <p className="text-base font-bold">{formatCurrency(currentMonth?.expense ?? 0)}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] opacity-70 mb-1 uppercase">Lucro</p>
              <p className={cn('text-base font-bold', profit < 0 && 'text-red-300')}>
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] opacity-70 mb-1 uppercase">Margem</p>
              <p className="text-base font-bold">{profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receitas do Mês"
          value={formatCurrency(currentMonth?.income ?? 0)}
          trend={trends?.income}
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg="bg-success/10 border-success/20"
          iconColor="text-success"
          valueColor="text-success"
        />
        <KPICard
          title="Despesas do Mês"
          value={formatCurrency(currentMonth?.expense ?? 0)}
          trend={trends?.expense}
          invertTrend
          icon={<TrendingDown className="w-4 h-4" />}
          iconBg="bg-destructive/10 border-destructive/20"
          iconColor="text-destructive"
          valueColor="text-destructive"
        />
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(profit)}
          icon={<DollarSign className="w-4 h-4" />}
          iconBg={profit >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}
          iconColor={profit >= 0 ? 'text-primary' : 'text-destructive'}
          valueColor={profit >= 0 ? 'text-primary' : 'text-destructive'}
        />
        <KPICard
          title="Margem de Lucro"
          value={`${profitMargin.toFixed(1)}%`}
          icon={<Percent className="w-4 h-4" />}
          iconBg={profitMargin >= 0 ? 'bg-info/10 border-info/20' : 'bg-destructive/10 border-destructive/20'}
          iconColor={profitMargin >= 0 ? 'text-info' : 'text-destructive'}
          valueColor={profitMargin >= 0 ? 'text-info' : 'text-destructive'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fluxo de Caixa — 6 meses */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Fluxo de Caixa</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receitas × Despesas — últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData ?? []} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#2563eb" fill="url(#colorRec)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="url(#colorDes)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Categorias */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Despesas por Categoria</p>
          <p className="text-xs text-muted-foreground mb-4">Mês atual</p>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
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
              <div className="space-y-1.5 mt-3">
                {categoryBreakdown.slice(0, 5).map((entry: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                      <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
              Sem dados ainda
            </div>
          )}
        </div>
      </div>

      {/* Indicador de Saúde Financeira */}
      <div className={cn(
        'rounded-xl p-4 border',
        profit >= 0
          ? 'bg-success/5 border-success/20'
          : 'bg-destructive/5 border-destructive/20'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'
          )}>
            {profit >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-success" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-destructive" />
            )}
          </div>
          <div>
            <p className={cn('text-sm font-semibold', profit >= 0 ? 'text-success' : 'text-destructive')}>
              {profit >= 0 ? 'Negócio saudável' : 'Atenção: prejuízo no mês'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profit >= 0
                ? `Margem de lucro de ${profitMargin.toFixed(1)}% — continue assim!`
                : `Despesas superaram receitas em ${formatCurrency(Math.abs(profit))}. Revise seus gastos.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string
  trend?: number
  invertTrend?: boolean
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  valueColor: string
}

function KPICard({ title, value, trend, invertTrend, icon, iconBg, iconColor, valueColor }: KPICardProps) {
  const trendPositive = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) > 0

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className={cn('text-xl font-bold', valueColor)}>{value}</p>
      {trend !== undefined && trend !== 0 && (
        <p className={cn('text-xs mt-1 font-medium', trendPositive ? 'text-success' : 'text-destructive')}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FinanceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
