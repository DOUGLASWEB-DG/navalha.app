'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  CalendarDays,
  List,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  MessageCircle,
  Clock,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
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

import { PageHeader } from '@/components/dashboard/page-header'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusFilters = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'CANCELED', label: 'Cancelados' },
]

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)

  const monthStr = format(selectedDate, 'yyyy-MM')
  const queryParams = `?month=${monthStr}&status=${statusFilter}`
  const { data: appointments, mutate } = useSWR(`/api/appointments${queryParams}`, fetcher)

  async function updateStatus(id: string, status: AppointmentStatus) {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      mutate()
      const statusText = status === 'CONFIRMED' 
        ? 'Confirmado (WhatsApp enviado ao cliente)' 
        : status === 'COMPLETED' 
          ? 'Concluído (Receita registrada no caixa)' 
          : 'Cancelado';
      toast.success('Status Atualizado', { 
        description: `O agendamento foi marcado como ${statusText}.`
      })
    } catch {
      toast.error('Erro', { description: 'Falha ao atualizar agendamento.' })
    }
  }

  async function deleteAppointment(id: string) {
    const ok = await confirmAction({
      title: 'Excluir este agendamento?',
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Sucesso!', { description: 'Agendamento excluído.' })
    } catch {
      toast.error('Erro', { description: 'Falha ao excluir agendamento.' })
    }
  }

  function openWhatsApp(appt: any) {
    const phone = appt.client?.phone?.replace(/\D/g, '')
    const dateStr = format(new Date(appt.date), "d 'de' MMMM", { locale: ptBR })
    const time = format(new Date(appt.date), 'HH:mm')
    const msg = encodeURIComponent(
      `Olá ${appt.client?.name}! Este é um lembrete do seu agendamento de ${appt.service?.name} no dia ${dateStr} às ${time}. Até lá!`
    )
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank')
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
                'shrink-0 snap-start rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
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

      {/* Cabeçalho do Mês Atual */}
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-foreground capitalize">
          {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
          {appointments?.length ?? 0} agendamentos
        </span>
      </div>

      {/* Lista Inteligente de Agendamentos */}
      <div className="w-full">
        {appointments && appointments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {appointments.map((appt: any) => (
              <div
                key={appt.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40"
              >
                {/* Header do Card (Data/Hora e Ações) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                      <p className="text-xs font-bold leading-tight text-center">
                        {format(new Date(appt.date), 'dd/MM')} <br/>
                        <span className="text-[11px] uppercase font-semibold">{format(new Date(appt.date), 'HH:mm')}</span>
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingAppointment(appt); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openWhatsApp(appt)} className="gap-2 cursor-pointer text-success">
                        <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      {appt.status !== 'CONFIRMED' && (
                        <DropdownMenuItem onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="gap-2 cursor-pointer focus:bg-info/10 focus:text-info text-info">
                          <CheckCircle2 className="w-4 h-4" /> Confirmar
                        </DropdownMenuItem>
                      )}
                      {appt.status !== 'COMPLETED' && (
                        <DropdownMenuItem onClick={() => updateStatus(appt.id, 'COMPLETED')} className="gap-2 cursor-pointer focus:bg-success/10 focus:text-success text-success">
                          <CheckCircle2 className="w-4 h-4" /> Marcar Concluído
                        </DropdownMenuItem>
                      )}
                      {appt.status !== 'CANCELED' && (
                        <DropdownMenuItem onClick={() => updateStatus(appt.id, 'CANCELED')} className="gap-2 cursor-pointer focus:bg-muted/10 text-muted-foreground">
                          <XCircle className="w-4 h-4" /> Cancelar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => deleteAppointment(appt.id)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Corpo do Card (Cliente e Serviço) */}
                <div className="flex-1 mt-2">
                  <p className="text-base font-bold text-foreground mb-1 line-clamp-1">{appt.client?.name}</p>
                  <p className="text-sm font-medium text-muted-foreground line-clamp-1">{appt.service?.name}</p>
                  
                  <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{appt.service?.durationMins} min</span>
                    </div>
                    {appt.barber && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-primary/90 font-medium">Barbeiro: {appt.barber.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {appt.notes && (
                    <p className="mt-4 text-xs italic text-muted-foreground bg-muted/50 p-2.5 rounded-lg line-clamp-2 border border-border">
                      &quot;{appt.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Rodapé do Card (Preço) */}
                <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
                  <span className="text-sm font-bold text-foreground">
                    Valor
                  </span>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    R$ {appt.service?.price?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground mb-1">Nenhum agendamento</p>
            <p className="text-sm text-muted-foreground">
              Não há agendamentos para a data e filtros selecionados.
            </p>
            <Button
              onClick={() => { setEditingAppointment(null); setModalOpen(true) }}
              variant="link"
              className="mt-4 text-primary"
            >
              Criar primeiro agendamento
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
