'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { CashBalanceCard, type PeriodMonths } from './cash-balance-card'
import { CategoryBreakdown } from './category-breakdown'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiFetcher } from '@/lib/http-errors'

const fetcher = apiFetcher

export function FinanceDashboard() {
  const [months, setMonths] = useState<PeriodMonths>(6)
  // keepPreviousData: ao trocar de 6 para 12 meses o cartão não some enquanto carrega
  const { data, isLoading } = useSWR(`/api/finances/stats?months=${months}`, fetcher, { keepPreviousData: true })

  if (isLoading && !data) return <FinanceDashboardSkeleton />
  if (!data) return null

  const { currentMonth, trends, monthlyData, categoryBreakdown, allTime } = data
  const profit = currentMonth?.profit ?? 0
  const profitMargin = currentMonth?.profitMargin ?? 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Caixa + fluxo de receitas e despesas */}
      <CashBalanceCard
        balance={allTime?.balance ?? 0}
        monthlyData={monthlyData ?? []}
        currentMonth={{
          income: currentMonth?.income ?? 0,
          expense: currentMonth?.expense ?? 0,
          profit,
          profitMargin,
        }}
        trends={trends}
        months={months}
        onMonthsChange={setMonths}
      />

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

      {/* Categorias e saúde do negócio lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CategoryBreakdown data={categoryBreakdown ?? []} title="Onde você mais gastou" subtitle="Mês atual" />
        </div>

        <div className={cn(
          'rounded-xl p-5 border',
          profit >= 0
            ? 'bg-success/5 border-success/20'
            : 'bg-destructive/5 border-destructive/20'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 shrink-0 rounded-lg flex items-center justify-center',
              profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              {profit >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              )}
            </div>
            <p className={cn('text-sm font-semibold', profit >= 0 ? 'text-success' : 'text-destructive')}>
              {profit >= 0 ? 'Negócio saudável' : 'Atenção: prejuízo no mês'}
            </p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {profit >= 0
              ? `Margem de lucro de ${profitMargin.toFixed(1)}% neste mês. Continue assim!`
              : `Despesas superaram receitas em ${formatCurrency(Math.abs(profit))}. Revise seus gastos.`
            }
          </p>
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
        <p className="text-xs text-muted-foreground font-medium tracking-wide">{title}</p>
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

const SKELETON_HEIGHTS = [45, 70, 35, 90, 55, 65, 30, 80, 50, 75, 40, 60]

function FinanceDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-[34rem] rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fake Area Chart Skeleton */}
        <div className="lg:col-span-2 h-72 rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-[2px] w-full opacity-20" />
            <Skeleton className="h-[2px] w-full opacity-20" />
            <Skeleton className="h-[2px] w-full opacity-20" />
            <Skeleton className="h-[2px] w-full opacity-20" />
          </div>
          <div className="mt-8 flex gap-2 items-end h-16">
            {/* Alturas fixas: valores aleatórios geravam HTML diferente no servidor e no navegador (aviso de hidratação) */}
            {SKELETON_HEIGHTS.map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* Barras por categoria */}
        <div className="h-72 rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <Skeleton className="h-4 w-40" />
          {[100, 70, 45, 30, 15].map((w) => (
            <Skeleton key={w} className="h-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
