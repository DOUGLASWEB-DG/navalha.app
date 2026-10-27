'use client'

import useSWR from 'swr'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { AppIcon } from '@/components/shared/app-icon'
import { StatCard } from '@/components/dashboard/stat-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'

import { ErrorState } from '@/components/shared/data-state'
import { apiFetcher } from '@/lib/http-errors'

const fetcher = apiFetcher

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000,
  })
  // Datas e horários no relógio da barbearia, não no do aparelho
  const timeZone = useBarbeariaTimeZone()
  // Saudação com o nome de quem entrou (mesma chave SWR do menu e da barra do painel, sem requisição extra)
  const { data: authData } = useSWR('/api/auth/me', fetcher)
  const userName: string | undefined = authData?.user?.name

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <ErrorState message="Não foi possível carregar os dados do painel." onRetry={() => mutate()} />
  }

  const {
    revenue,
    totalClients,
    appointmentStats,
    todayAppointments,
    recentTransactions,
    goals,
    chartData,
  } = data ?? {}

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      {/* Boas-vindas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
            {userName ? `${getGreeting(timeZone)}, ${userName}` : getGreeting(timeZone)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {appointmentStats?.total ?? 0} agendamentos para hoje
          </p>
        </div>
        <Link href="/dashboard/appointments" className="shrink-0 sm:w-auto w-full">
          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
            Novo Agendamento
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas — carrossel no mobile, grid no desktop */}
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible pb-1 touch-pan-x lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:snap-none">
        <StatCard
          title="Receita de Hoje"
          value={formatCurrency(revenue?.daily ?? 0)}
          subtitle="Faturamento do dia"
          iconUrl="/assets/icons/receitahoje-icon.png"
          accent="gold"
          trend={{ value: '12%', positive: true }}
        />
        <StatCard
          title="Receita Semanal"
          value={formatCurrency(revenue?.weekly ?? 0)}
          subtitle="Faturamento da semana"
          iconUrl="/assets/icons/receitasamanal-icon.png"
          accent="green"
        />
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(revenue?.monthly ?? 0)}
          subtitle="Faturamento do mês"
          iconUrl="/assets/icons/receitamensal-icon.png"
          accent="blue"
        />
        <StatCard
          title="Total de Clientes"
          value={String(totalClients ?? 0)}
          subtitle="Cadastrados no sistema"
          iconUrl="/assets/icons/totalclientes-icon.png"
          accent="gold"
        />
      </div>

      {/* Status de hoje: uma faixa só, três contadores */}
      <section aria-label="Situação dos agendamentos de hoje" className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        {[
          { label: 'Pendentes', value: appointmentStats?.pending ?? 0, icon: '/assets/icons/pendentes-icon.png' },
          { label: 'Confirmados', value: appointmentStats?.confirmed ?? 0, icon: '/assets/icons/confirmados-icon.png' },
          { label: 'Concluídos', value: appointmentStats?.completed ?? 0, icon: '/assets/icons/concluidos-icon.png' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 px-2 py-3 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:text-left">
            <div className="h-8 w-8 shrink-0 sm:h-10 sm:w-10">
              <AppIcon src={item.icon} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none text-foreground tabular-nums">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Corpo: agenda e gráfico à esquerda; metas e transações à direita */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Agenda de Hoje: lista compacta */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Agenda de Hoje</h3>
                <p className="mt-0.5 text-xs text-muted-foreground first-letter:uppercase">
                  {format(toZonedWallClock(new Date(), timeZone), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Link href="/dashboard/appointments" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-2 text-sm">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {todayAppointments && todayAppointments.length > 0 ? (
              <ul className="divide-y divide-border">
                {todayAppointments.map((appt: any) => {
                  const serviceNames = appt.appointmentServices?.length
                    ? appt.appointmentServices.map((item: any) => item.service?.name).join(', ')
                    : appt.service?.name
                  const price = appt.appointmentServices?.length
                    ? appt.appointmentServices.reduce((total: number, item: any) => total + item.price, 0)
                    : appt.service?.price || 0
                  return (
                    <li key={appt.id} className="flex items-center gap-4 px-5 py-3">
                      <p className="w-14 shrink-0 text-base font-semibold text-foreground tabular-nums">
                        {format(toZonedWallClock(appt.date, timeZone), 'HH:mm')}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{appt.client?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {serviceNames}
                          <span className="hidden sm:inline"> · {appt.barber?.name ?? 'Sem barbeiro'}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <StatusBadge status={appt.status} />
                        <span className="text-right text-sm font-semibold text-foreground tabular-nums sm:w-24">
                          {formatCurrency(price)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
                <Link href="/dashboard/appointments">
                  <Button variant="link" className="mt-1 text-sm text-primary">
                    Agendar agora
                  </Button>
                </Link>
              </div>
            )}
          </section>

          <RevenueChart data={chartData ?? []} />
        </div>

        <div className="flex flex-col gap-6">
          {/* Metas */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">Metas ativas</h3>
              <Link
                href="/dashboard/goals"
                className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-medium text-primary transition-all active:scale-[0.98]"
              >
                Gerenciar
              </Link>
            </div>
            {goals && goals.length > 0 ? (
              <div className="flex flex-col gap-4">
                {goals.map((goal: any) => {
                  const progress = Math.min(((revenue?.monthly ?? 0) / goal.targetAmount) * 100, 100)
                  return (
                    <div key={goal.id} className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{goal.title}</span>
                        <span className="font-semibold text-foreground tabular-nums">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">Meta: {formatCurrency(goal.targetAmount)}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhuma meta ativa</p>
                <Link href="/dashboard/goals">
                  <Button variant="link" size="sm" className="mt-1 text-primary">
                    Definir uma meta
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Transações recentes */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h3 className="whitespace-nowrap text-base font-semibold text-foreground">Transações recentes</h3>
              <Link href="/dashboard/finances" className="shrink-0">
                <Button variant="outline" size="sm" className="text-sm">
                  Ver todas
                </Button>
              </Link>
            </div>
            {recentTransactions && recentTransactions.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentTransactions.map((txn: any) => (
                  <li key={txn.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          txn.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {txn.type === 'INCOME' ? <TrendingUp className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(toZonedWallClock(txn.date, timeZone), "d 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        txn.type === 'INCOME' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function getGreeting(timeZone?: string) {
  const h = toZonedWallClock(new Date(), timeZone).getHours()
  if (h < 12) return 'Bom dia'
  if (h < 17) return 'Boa tarde'
  return 'Boa noite'
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <p className="text-sm text-muted-foreground font-medium animate-pulse mb-2">Atualizando seu painel...</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl sm:w-44" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl lg:h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
