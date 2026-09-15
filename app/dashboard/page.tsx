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
import { StatCard } from '@/components/dashboard/stat-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-destructive">
          Oops! Algo deu errado.
        </h2>
        <p className="text-muted-foreground mt-2">
          Não foi possível carregar os dados do dashboard. Tente novamente mais
          tarde.
        </p>
      </div>
    )
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
            {getGreeting()}, Patrão
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
          value={`R$${(revenue?.daily ?? 0).toFixed(2)}`}
          subtitle="Faturamento do dia"
          icon={DollarSign}
          accent="gold"
          trend={{ value: '12%', positive: true }}
        />
        <StatCard
          title="Receita Semanal"
          value={`R$${(revenue?.weekly ?? 0).toFixed(2)}`}
          subtitle="Faturamento da semana"
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          title="Receita Mensal"
          value={`R$${(revenue?.monthly ?? 0).toFixed(2)}`}
          subtitle="Faturamento do mês"
          icon={DollarSign}
          accent="blue"
        />
        <StatCard
          title="Total de Clientes"
          value={String(totalClients ?? 0)}
          subtitle="Cadastrados no sistema"
          icon={Users}
          accent="gold"
        />
      </div>

      {/* Status dos Agendamentos — swipe no mobile */}
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 touch-pan-x lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0 lg:snap-none">
        <div className="min-w-[min(100%,11rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 backdrop-blur-sm transition-all duration-150 active:scale-[0.98] active:bg-muted lg:min-w-0 lg:flex lg:items-center lg:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-3 lg:mt-0">
            <p className="text-xl font-bold text-foreground">{appointmentStats?.pending ?? 0}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>
        <div className="min-w-[min(100%,11rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 backdrop-blur-sm transition-all duration-150 active:scale-[0.98] active:bg-muted lg:min-w-0 lg:flex lg:items-center lg:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-info/20 bg-info/10">
            <AlertCircle className="h-5 w-5 text-info" />
          </div>
          <div className="mt-3 lg:mt-0">
            <p className="text-xl font-bold text-foreground">{appointmentStats?.confirmed ?? 0}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
        </div>
        <div className="min-w-[min(100%,11rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 backdrop-blur-sm transition-all duration-150 active:scale-[0.98] active:bg-muted lg:min-w-0 lg:flex lg:items-center lg:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div className="mt-3 lg:mt-0">
            <p className="text-xl font-bold text-foreground">{appointmentStats?.completed ?? 0}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
        </div>
      </div>

      {/* Gráfico + Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData ?? []} />
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Metas Ativas</h3>
            <Link
              href="/dashboard/goals"
              className="inline-flex min-h-12 items-center rounded-xl px-2 text-xs font-medium text-primary transition-all active:scale-[0.98] active:bg-white/5"
            >
              Gerenciar
            </Link>
          </div>
          {goals && goals.length > 0 ? (
            <div className="flex flex-col gap-4">
              {goals.map((goal: any) => {
                const progress = Math.min(
                  ((revenue?.monthly ?? 0) / goal.targetAmount) * 100,
                  100
                )
                return (
                  <div key={goal.id} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{goal.title}</span>
                      <span className="text-foreground font-semibold">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Meta: R${goal.targetAmount.toFixed(0)}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-6">
              <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma meta ativa</p>
              <Link href="/dashboard/goals">
                <Button variant="link" size="sm" className="text-primary mt-1">
                  Definir uma meta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Agendamentos de Hoje */}
      <div className="rounded-3xl border border-border bg-card p-5 backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agenda de Hoje</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Link href="/dashboard/appointments" className="shrink-0">
            <Button variant="outline" size="sm" className="w-full gap-2 border-white/10 text-xs sm:w-auto">
              Ver Todos <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {todayAppointments && todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todayAppointments.map((appt: any) => (
              <div
                key={appt.id}
                className="flex min-h-[17rem] flex-col rounded-2xl border border-border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl border border-primary/10 bg-primary/10 px-3 py-2 text-center">
                    <p className="text-sm font-bold text-primary">
                      {format(new Date(appt.date), 'dd/MM')}
                    </p>
                    <p className="text-base font-bold leading-tight text-primary">
                      {format(new Date(appt.date), 'HH:mm')}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="mt-5 min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{appt.client?.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {appt.appointmentServices?.length
                      ? appt.appointmentServices.map((item: any) => item.service?.name).join(', ')
                      : appt.service?.name}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {appt.appointmentServices?.length
                        ? appt.appointmentServices.reduce((total: number, item: any) => total + item.durationMins, 0)
                        : appt.service?.durationMins} min
                    </span>
                    <span className="truncate text-primary/80">
                      Barbeiro: {appt.barber?.name ?? 'Não definido'}
                    </span>
                  </div>
                  {appt.notes && (
                    <p className="mt-3 line-clamp-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs italic text-muted-foreground">
                      &quot;{appt.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-semibold text-foreground">Valor</span>
                  <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-base font-bold text-primary">
                    R${(appt.appointmentServices?.length
                      ? appt.appointmentServices.reduce((total: number, item: any) => total + item.price, 0)
                      : appt.service?.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
            <Link href="/dashboard/appointments">
              <Button variant="link" className="text-primary text-sm mt-1">
                Agendar agora
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Transações Recentes */}
      <div className="rounded-3xl border border-border bg-card p-5 backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
          <Link href="/dashboard/finances" className="shrink-0">
            <Button variant="outline" size="sm" className="w-full gap-2 border-white/10 text-xs sm:w-auto">
              Ver Todas <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="flex flex-col gap-3 lg:gap-0 lg:divide-y lg:divide-border">
            {recentTransactions.map((txn: any) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-all duration-150 active:scale-[0.99] active:bg-muted lg:rounded-none lg:border-0 lg:bg-transparent lg:p-3 lg:active:scale-100"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      txn.type === 'INCOME'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {txn.type === 'INCOME' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(txn.date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    txn.type === 'INCOME' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {txn.type === 'INCOME' ? '+' : '-'}R${txn.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação ainda</p>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 17) return 'Boa tarde'
  return 'Boa noite'
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
