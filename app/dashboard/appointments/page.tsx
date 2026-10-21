'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  CalendarDays,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Pencil,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { confirmAction } from '@/lib/confirm-toast'
import { formatBrazilPhone, formatCurrency, normalizeBrazilPhone } from '@/lib/format'
import { CANCELLATION_NOTICE_MINUTES } from '@/lib/appointment-rules'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'

import { PageHeader } from '@/components/dashboard/page-header'

import { ErrorState, GridSkeleton } from '@/components/shared/data-state'
import { apiFetcher } from '@/lib/http-errors'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const fetcher = apiFetcher

const statusFilters = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'CANCELED', label: 'Cancelados' },
]

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

interface AppointmentItem {
  id: string
  date: string
  status: AppointmentStatus
  notes: string | null
  client?: { id: string; name: string; phone: string } | null
  barber?: { id: string; name: string } | null
  service?: { name: string; price: number; durationMins: number } | null
  appointmentServices?: { price: number; durationMins: number; service?: { name: string } | null }[]
}

// Resumo de serviços: usa a tabela de serviços do agendamento; cai no serviço legado se vazia.
function summarize(appt: AppointmentItem) {
  const items = appt.appointmentServices ?? []
  if (items.length > 0) {
    return {
      names: items.map((item) => item.service?.name).filter(Boolean).join(', '),
      price: items.reduce((total, item) => total + item.price, 0),
      durationMins: items.reduce((total, item) => total + item.durationMins, 0),
    }
  }
  return {
    names: appt.service?.name ?? '',
    price: appt.service?.price ?? 0,
    durationMins: appt.service?.durationMins ?? 0,
  }
}

function dayLabel(date: Date, now: Date) {
  const full = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  if (isSameDay(date, now)) return `Hoje · ${full}`
  if (isSameDay(date, addDays(now, 1))) return `Amanhã · ${full}`
  if (isSameDay(date, addDays(now, -1))) return `Ontem · ${full}`
  return full
}

// Espelha assertStatusTransition (lib/appointment-rules.ts) para mostrar só ações que o servidor aceita.
// O servidor continua sendo a fonte da verdade e valida de novo.
function getActions(appt: AppointmentItem, isAdmin: boolean, now: Date) {
  const date = new Date(appt.date)
  const isPast = date.getTime() <= now.getTime()
  const isActive = appt.status === 'PENDING' || appt.status === 'CONFIRMED'

  let primary: { label: string; status: AppointmentStatus } | null = null
  if (appt.status === 'PENDING' && (isAdmin || !isPast)) primary = { label: 'Confirmar', status: 'CONFIRMED' }
  if (appt.status === 'CONFIRMED' && (isAdmin || isPast)) primary = { label: 'Concluir', status: 'COMPLETED' }

  let cancelBlockedReason: string | null = null
  if (isActive && !isAdmin) {
    if (isPast) cancelBlockedReason = 'O horário já passou'
    else if (date.getTime() - now.getTime() < CANCELLATION_NOTICE_MINUTES * 60_000) {
      cancelBlockedReason = 'Cancelamento só com 2h de antecedência'
    }
  }

  let hint: { text: string; tone: 'warning' | 'muted' } | null = null
  if (appt.status === 'PENDING' && isPast) hint = { text: 'Horário passou sem confirmação', tone: 'warning' }
  else if (appt.status === 'CONFIRMED' && !isPast && !isAdmin) hint = { text: 'Concluir após o horário', tone: 'muted' }

  return { primary, canCancel: isActive, cancelBlockedReason, hint }
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const monthStr = format(selectedDate, 'yyyy-MM')
  const queryParams = `?month=${monthStr}&status=${statusFilter}`
  const { data: appointments, error, isLoading, mutate } = useSWR<AppointmentItem[]>(`/api/appointments${queryParams}`, fetcher)
  const { data: authData } = useSWR('/api/auth/me', fetcher)
  const isAdmin = authData?.user?.role === 'ADMIN'
  const timeZone = useBarbeariaTimeZone()
  const now = new Date()
  // Dia e hora exibidos são os do relógio da barbearia, não os do aparelho
  const today = toZonedWallClock(now, timeZone)

  // Agrupa por dia da barbearia (a API já devolve ordenado por data).
  const groups: { key: string; date: Date; items: AppointmentItem[] }[] = []
  for (const appt of appointments ?? []) {
    const date = toZonedWallClock(appt.date, timeZone)
    const key = format(date, 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(appt)
    else groups.push({ key, date, items: [appt] })
  }

  async function updateStatus(appt: AppointmentItem, status: AppointmentStatus) {
    if (status === 'COMPLETED') {
      const ok = await confirmAction({
        title: `Concluir atendimento de ${appt.client?.name ?? 'cliente'}?`,
        description: `A receita de ${formatCurrency(summarize(appt).price)} será registrada no caixa.`,
        confirmLabel: 'Concluir',
      })
      if (!ok) return
    }
    if (status === 'CANCELED') {
      const ok = await confirmAction({
        title: `Cancelar agendamento de ${appt.client?.name ?? 'cliente'}?`,
        description: 'O horário volta a ficar livre na agenda.',
        confirmLabel: 'Cancelar agendamento',
        tone: 'danger',
        cancelLabel: 'Voltar',
      })
      if (!ok) return
    }

    setUpdatingId(appt.id)
    try {
      await apiRequest(`/api/appointments/${appt.id}`, { method: 'PATCH', json: { status } })
      await mutate()
      const statusText = status === 'CONFIRMED'
        ? 'Agendamento confirmado.'
        : status === 'COMPLETED'
          ? 'Atendimento concluído. Receita registrada no caixa.'
          : 'Agendamento cancelado.'
      toast.success('Status atualizado', { description: statusText })
    } catch (error) {
      showError('Não foi possível atualizar o agendamento', error)
    } finally {
      setUpdatingId(null)
    }
  }

  function openWhatsApp(appt: AppointmentItem) {
    // O telefone já é salvo com DDI 55; normalizeBrazilPhone evita duplicar o prefixo.
    const phone = normalizeBrazilPhone(appt.client?.phone ?? '')
    if (!phone) {
      toast.error('Telefone inválido', { description: 'Atualize o telefone do cliente antes de abrir o WhatsApp.' })
      return
    }
    const date = toZonedWallClock(appt.date, timeZone)
    const msg = encodeURIComponent(
      `Olá ${appt.client?.name}! Este é um lembrete do seu agendamento de ${summarize(appt).names} no dia ${format(date, "d 'de' MMMM", { locale: ptBR })} às ${format(date, 'HH:mm')}. Até lá!`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  function openEdit(appt: AppointmentItem) {
    setEditingAppointment(appt)
    setModalOpen(true)
  }

  function renderMenu(appt: AppointmentItem, actions: ReturnType<typeof getActions>) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground xl:h-9 xl:min-h-0 xl:w-9"
            aria-label={`Mais ações do agendamento de ${appt.client?.name ?? 'cliente'}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onClick={() => openEdit(appt)} className="gap-2 cursor-pointer">
            <Pencil className="w-4 h-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openWhatsApp(appt)} className="gap-2 cursor-pointer">
            <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
          </DropdownMenuItem>
          {actions.canCancel && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                disabled={Boolean(actions.cancelBlockedReason)}
                onClick={() => updateStatus(appt, 'CANCELED')}
                className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="flex flex-col">
                  Cancelar agendamento
                  {actions.cancelBlockedReason && (
                    <span className="text-xs text-muted-foreground">{actions.cancelBlockedReason}</span>
                  )}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function renderPrimary(appt: AppointmentItem, actions: ReturnType<typeof getActions>, className?: string) {
    if (!actions.primary) return null
    const { label, status } = actions.primary
    return (
      <Button
        onClick={() => updateStatus(appt, status)}
        isLoading={updatingId === appt.id}
        disabled={updatingId !== null && updatingId !== appt.id}
        variant={status === 'COMPLETED' ? 'default' : 'outline'}
        className={cn('gap-2', className)}
      >
        <CheckCircle2 className="h-4 w-4" />
        {label}
      </Button>
    )
  }

  function renderHint(actions: ReturnType<typeof getActions>) {
    if (!actions.hint) return null
    return (
      <p className={cn('text-xs', actions.hint.tone === 'warning' ? 'text-warning' : 'text-muted-foreground')}>
        {actions.hint.text}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Agendamentos"
        description="Gerencie sua agenda de horários"
      >
        <Button
          onClick={() => { setEditingAppointment(null); setModalOpen(true) }}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </PageHeader>

      {/* Controles e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="month"
          aria-label="Mês"
          value={format(selectedDate, 'yyyy-MM')}
          onChange={(e) => {
             const [year, month] = e.target.value.split('-');
             if (year && month) {
               setSelectedDate(new Date(Number(year), Number(month) - 1, 1, 12, 0, 0));
             }
          }}
          className="min-h-12 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />

        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm touch-pan-x">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'min-h-11 shrink-0 snap-start rounded-lg px-4 text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground active:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cabeçalho do Mês */}
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-foreground first-letter:uppercase">
          {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        {!isLoading && !error && appointments && (
          <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            {appointments.length} agendamentos
          </span>
        )}
      </div>

      {/* Agenda agrupada por dia */}
      <div className="w-full">
        {isLoading ? (
          <GridSkeleton message="Procurando agendamentos..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar os agendamentos." onRetry={() => mutate()} />
        ) : groups.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => {
              const isToday = isSameDay(group.date, today)
              return (
                <section key={group.key} aria-label={dayLabel(group.date, today)} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <header className={cn('flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-5', isToday ? 'bg-primary/5' : 'bg-muted/40')}>
                    <h4 className={cn('text-sm font-semibold first-letter:uppercase', isToday ? 'text-primary' : 'text-foreground')}>
                      {dayLabel(group.date, today)}
                    </h4>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.items.length} {group.items.length === 1 ? 'horário' : 'horários'}
                    </span>
                  </header>

                  {/* Desktop: tabela */}
                  <table className="hidden w-full table-fixed text-sm xl:table">
                    {/* Larguras fixas: as colunas ficam alinhadas entre os dias */}
                    <colgroup>
                      <col className="w-[150px]" />
                      <col />
                      <col />
                      {isAdmin && <col />}
                      <col className="w-[110px]" />
                      <col className="w-[150px]" />
                      <col className="w-[200px]" />
                    </colgroup>
                    <thead className="border-b border-border text-left text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-medium">Horário</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Cliente</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Serviços</th>
                        {isAdmin && <th scope="col" className="px-4 py-2.5 font-medium">Barbeiro</th>}
                        <th scope="col" className="px-4 py-2.5 text-right font-medium">Valor</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                        <th scope="col" className="px-4 py-2.5 font-medium"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.items.map((appt) => {
                        const date = toZonedWallClock(appt.date, timeZone)
                        const summary = summarize(appt)
                        const end = new Date(date.getTime() + summary.durationMins * 60_000)
                        const actions = getActions(appt, isAdmin, now)
                        return (
                          <tr key={appt.id} className={cn('align-top transition-colors hover:bg-muted/30', appt.status === 'CANCELED' && 'opacity-60')}>
                            <td className="px-5 py-3">
                              <p className="whitespace-nowrap font-semibold text-foreground tabular-nums">{format(date, 'HH:mm')} – {format(end, 'HH:mm')}</p>
                              <p className="text-xs text-muted-foreground">{summary.durationMins} min</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="truncate font-medium text-foreground">{appt.client?.name}</p>
                              {appt.client?.phone && (
                                <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{formatBrazilPhone(appt.client.phone)}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-foreground">{summary.names}</p>
                              {appt.notes && (
                                <p className="truncate text-xs text-muted-foreground" title={appt.notes}>Obs.: {appt.notes}</p>
                              )}
                            </td>
                            {isAdmin && <td className="truncate px-4 py-3 text-muted-foreground">{appt.barber?.name ?? '—'}</td>}
                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground tabular-nums">{formatCurrency(summary.price)}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <StatusBadge status={appt.status} />
                                {renderHint(actions)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {renderPrimary(appt, actions, 'min-h-0 h-9 w-[7.5rem] justify-center px-3') ?? <span className="w-[7.5rem] shrink-0" aria-hidden />}
                                {renderMenu(appt, actions)}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Mobile e tablet: cards com rótulos */}
                  <ul className="divide-y divide-border xl:hidden">
                    {group.items.map((appt) => {
                      const date = toZonedWallClock(appt.date, timeZone)
                      const summary = summarize(appt)
                      const end = new Date(date.getTime() + summary.durationMins * 60_000)
                      const actions = getActions(appt, isAdmin, now)
                      return (
                        <li key={appt.id} className={cn('p-4', appt.status === 'CANCELED' && 'opacity-60')}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-lg font-semibold text-foreground tabular-nums">
                                {format(date, 'HH:mm')} <span className="text-muted-foreground">– {format(end, 'HH:mm')}</span>
                              </p>
                              <p className="truncate font-medium text-foreground">{appt.client?.name}</p>
                              {appt.client?.phone && (
                                <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{formatBrazilPhone(appt.client.phone)}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-start gap-1">
                              <StatusBadge status={appt.status} className="mt-1.5" />
                              {renderMenu(appt, actions)}
                            </div>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="col-span-2">
                              <dt className="text-xs text-muted-foreground">Serviços</dt>
                              <dd className="text-foreground">{summary.names}</dd>
                            </div>
                            {isAdmin && (
                              <div>
                                <dt className="text-xs text-muted-foreground">Barbeiro</dt>
                                <dd className="text-foreground">{appt.barber?.name ?? '—'}</dd>
                              </div>
                            )}
                            <div>
                              <dt className="text-xs text-muted-foreground">Valor</dt>
                              <dd className="font-medium text-foreground tabular-nums">{formatCurrency(summary.price)}</dd>
                            </div>
                          </dl>

                          {appt.notes && (
                            <p className="mt-3 line-clamp-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Obs.: {appt.notes}</p>
                          )}

                          {(actions.primary || actions.hint) && (
                            <div className="mt-3 space-y-2">
                              {renderHint(actions)}
                              {renderPrimary(appt, actions, 'h-11 w-full')}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground mb-1">Nenhum agendamento</p>
            <p className="text-sm text-muted-foreground">
              Não há agendamentos para o mês e o filtro selecionados.
            </p>
            <Button
              onClick={() => { setEditingAppointment(null); setModalOpen(true) }}
              variant="link"
              className="mt-4 text-primary"
            >
              Criar agendamento
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      <AppointmentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAppointment(null) }}
        appointment={editingAppointment}
        onSaved={() => { mutate(); setModalOpen(false); setEditingAppointment(null) }}
        defaultDate={selectedDate}
      />
    </div>
  )
}
