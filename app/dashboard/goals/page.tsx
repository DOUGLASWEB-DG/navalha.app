'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { cn } from '@/lib/utils'

import { PageHeader } from '@/components/dashboard/page-header'
import { AppIcon } from '@/components/shared/app-icon'
import { apiFetcher } from '@/lib/http-errors'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const fetcher = apiFetcher

const goalTypeConfig = {
  REVENUE: { label: 'Receita', iconUrl: '/assets/icons/receitamensal-icon.png' },
  CLIENTS: { label: 'Novos Clientes', iconUrl: '/assets/icons/totalclientes-icon.png' },
  APPOINTMENTS: { label: 'Agendamentos', iconUrl: '/assets/icons/agendamentos-icon.png' },
}

const periodLabels: Record<string, string> = {
  daily: 'diária',
  weekly: 'semanal',
  monthly: 'mensal',
}

export default function GoalsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  // Datas das metas no relógio da barbearia, não no do aparelho
  const timeZone = useBarbeariaTimeZone()
  const { data: goals, mutate } = useSWR('/api/goals', fetcher)
  const { data: financeData } = useSWR('/api/dashboard', fetcher)

  async function deleteGoal(id: string) {
    const ok = await confirmAction({
      title: 'Excluir esta meta?',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await apiRequest(`/api/goals/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Meta excluída')
    } catch (error) {
      showError('Não foi possível excluir a meta', error)
    }
  }

  function getProgress(goal: any): number {
    if (!financeData) return 0
    const now = new Date()
    const isActiveGoal = isWithinInterval(now, {
      start: new Date(goal.startDate),
      end: new Date(goal.endDate),
    })
    if (!isActiveGoal) return 0

    let current = 0
    if (goal.type === 'REVENUE') {
      current = goal.period === 'daily'
        ? financeData.revenue.daily
        : goal.period === 'weekly'
        ? financeData.revenue.weekly
        : financeData.revenue.monthly
    } else if (goal.type === 'CLIENTS') {
      current = financeData.totalClients
    } else if (goal.type === 'APPOINTMENTS') {
      current = financeData.appointmentStats?.total ?? 0
    }

    return Math.min((current / goal.targetAmount) * 100, 100)
  }

  function isActive(goal: any) {
    return isWithinInterval(new Date(), {
      start: new Date(goal.startDate),
      end: new Date(goal.endDate),
    })
  }

  const activeGoals = goals?.filter((g: any) => isActive(g)) ?? []
  const pastGoals = goals?.filter((g: any) => !isActive(g)) ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <PageHeader
        title="Metas"
        iconUrl="/assets/icons/metas-icon.png"
        description="Acompanhe seus objetivos de negócio e crescimento"
      >
        <Button
          onClick={() => setModalOpen(true)}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </PageHeader>

      {/* Metas Ativas */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            Metas Ativas
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal: any) => {
              const config = goalTypeConfig[goal.type as keyof typeof goalTypeConfig]
              const progress = getProgress(goal)
              const isCompleted = progress >= 100

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'bg-card border-border shadow-sm rounded-3xl p-6 flex flex-col gap-5 group transition-all duration-200 hover:border-white/20 hover:bg-card',
                    isCompleted && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60 p-1.5">
                        <AppIcon src={config.iconUrl} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground leading-tight">{goal.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Meta {periodLabels[goal.period] || goal.period} · {config.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="h-7 w-7 shrink-0"><AppIcon src="/assets/icons/concluidos-icon.png" /></span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progresso */}
                  <div className="flex flex-col gap-2.5 mt-auto">
                    <div className="flex justify-between items-end">
                      <span className={cn('text-3xl font-bold tracking-tight', isCompleted ? 'text-primary' : 'text-foreground')}>
                        {progress.toFixed(0)}%
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-background px-2.5 py-1 rounded-lg border border-border">
                        <span className="h-5 w-5 shrink-0"><AppIcon src="/assets/icons/metas-icon.png" /></span>
                        Alvo: {goal.type === 'REVENUE' ? 'R$' : ''}{goal.targetAmount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn('h-3 rounded-full', isCompleted ? 'bg-primary/20 [&>div]:bg-primary' : 'bg-card')}
                    />
                    {isCompleted && (
                      <p className="text-xs text-primary font-medium text-center animate-in fade-in slide-in-from-bottom-1">Meta alcançada! 🎉</p>
                    )}
                  </div>

                  {/* Datas */}
                  <div className="flex justify-between text-xs font-medium text-muted-foreground pt-4 border-t border-border">
                    <span>{format(toZonedWallClock(goal.startDate, timeZone), "d 'de' MMM", { locale: ptBR })}</span>
                    <span>Vence em {format(toZonedWallClock(goal.endDate, timeZone), "d 'de' MMM", { locale: ptBR })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metas Passadas */}
      {pastGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">Histórico de Metas</h3>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col divide-y divide-white/5">
              {pastGoals.map((goal: any) => {
                const config = goalTypeConfig[goal.type as keyof typeof goalTypeConfig]
                return (
                  <div key={goal.id} className="flex items-center gap-4 px-5 py-4 group transition-colors hover:bg-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 p-1 opacity-70">
                      <AppIcon src={config.iconUrl} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {format(toZonedWallClock(goal.startDate, timeZone), "d 'de' MMM", { locale: ptBR })} – {format(toZonedWallClock(goal.endDate, timeZone), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground whitespace-nowrap bg-background px-3 py-1.5 rounded-lg border border-border hidden sm:block">
                      Meta: {goal.type === 'REVENUE' ? 'R$' : ''}{goal.targetAmount.toLocaleString('pt-BR')}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {(!goals || goals.length === 0) && (
        <div className="text-center py-20">
          <div className="mx-auto mb-6 h-24 w-24">
            <AppIcon src="/assets/icons/metas-icon.png" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">Nenhuma meta definida</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Defina metas ambiciosas para acompanhar o crescimento da sua barbearia e manter a equipe motivada.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Criar Primeira Meta
          </Button>
        </div>
      )}

      <GoalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { mutate(); setModalOpen(false) }}
      />
    </div>
  )
}
