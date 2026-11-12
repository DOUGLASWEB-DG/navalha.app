'use client'

import { SystemIcon } from '@/components/shared/system-icon'

import { LIMITES } from '@/lib/input-limits'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/format'
import useSWR from 'swr'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { User, Scissors, CalendarDays, Clock, FileText, Activity, Sparkles } from 'lucide-react'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'
import { apiFetcher } from '@/lib/http-errors'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const fetcher = apiFetcher

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  serviceIds: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  barberId: z.string().optional(),
  clientPackageId: z.string().optional().nullable(),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

interface Props {
  open: boolean
  onClose: () => void
  appointment?: any
  onSaved: () => void
  defaultDate?: Date
}

export function AppointmentFormModal({ open, onClose, appointment, onSaved, defaultDate }: Props) {
  const { data: clients } = useSWR('/api/clients?minimal=true', fetcher)
  const { data: services } = useSWR('/api/services', fetcher)
  const { data: usersData } = useSWR('/api/users', fetcher)
  const { data: authData } = useSWR('/api/auth/me', fetcher)

  const users = usersData || []
  const user = authData?.user
  // Data e hora do formulário são as do relógio da barbearia, não as do aparelho
  const timeZone = useBarbeariaTimeZone()
  const todayValue = () => format(toZonedWallClock(new Date(), timeZone), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'PENDING',
      date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : todayValue(),
      time: '09:00',
      clientPackageId: null,
    },
  })

  const selectedClientId = watch('clientId')
  const { data: clientPackages } = useSWR(
    selectedClientId ? `/api/client-packages?clientId=${selectedClientId}&status=ACTIVE` : null,
    fetcher
  )

  useEffect(() => {
    if (appointment) {
      const apptDate = toZonedWallClock(appointment.date, timeZone)
      reset({
        clientId: appointment.clientId,
        serviceIds: appointment.appointmentServices?.map((item: any) => item.serviceId) || [appointment.serviceId],
        barberId: appointment.barberId ?? 'any',
        clientPackageId: appointment.clientPackageId || null,
        date: format(apptDate, 'yyyy-MM-dd'),
        time: format(apptDate, 'HH:mm'),
        status: appointment.status,
        notes: appointment.notes ?? '',
      })
    } else {
      reset({
        status: 'PENDING',
        date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : todayValue(),
        time: '09:00',
        clientId: '',
        serviceIds: [],
        barberId: user?.role === 'BARBER' ? user.id : 'any',
        clientPackageId: null,
        notes: '',
      })
    }
    // timeZone entra nas dependências: se o fuso chegar depois da abertura, o formulário é refeito com ele
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, open, defaultDate, reset, timeZone, user])

  async function onSubmit(data: FormData) {
    // Envia data e hora como digitadas (sem "Z"): o servidor interpreta no fuso da barbearia.
    // toISOString() converteria pelo fuso do aparelho e deslocaria o horário.
    const datetime = `${data.date}T${data.time}`

    try {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments'
      const method = appointment ? 'PATCH' : 'POST'

      await apiRequest(url, {
        method,
        json: {
          clientId: data.clientId,
          serviceIds: data.serviceIds,
          serviceId: data.serviceIds[0],
          barberId: data.barberId === 'any' ? undefined : data.barberId,
          clientPackageId: data.clientPackageId ? data.clientPackageId : null,
          date: datetime,
          status: data.status,
          notes: data.notes,
        },
      })

      toast.success(appointment ? 'Agendamento atualizado' : 'Agendamento criado', {
        description: appointment ? 'As alterações foram salvas na agenda.' : 'O horário já está reservado na agenda.',
      })
      onSaved()
    } catch (error) {
      // Regras do servidor (horário ocupado, fora do expediente...) chegam na mensagem
      showError('Não foi possível salvar o agendamento', error)
    }
  }

  const selectedServices = services?.filter((s: any) => watch('serviceIds')?.includes(s.id)) || []
  const totalPrice = selectedServices.reduce((total: number, service: any) => total + service.price, 0)
  const totalDuration = selectedServices.reduce((total: number, service: any) => total + service.durationMins, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-10 text-foreground"><SystemIcon name="novo-agendamento" className="h-8 w-8" /><span>{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</span></DialogTitle>
          <DialogDescription>Escolha o cliente, os serviços e o horário do atendimento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
          {/* Cliente */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="appointment-client" className="text-sm font-semibold text-foreground">Cliente *</Label>
            <div className="relative">
              <SystemIcon name="clientes" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
              <Select onValueChange={(v) => setValue('clientId', v)} value={watch('clientId')}>
                <SelectTrigger id="appointment-client" className="pl-11">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}

            {/* Aviso de Pacote Ativo do Cliente */}
            {clientPackages && clientPackages.length > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2 mt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <SystemIcon name="clube-de-assinatura-vip" className="h-5 w-5" />
                  Cliente possui pacote ativo!
                </div>
                {clientPackages.map((cp: any) => {
                  const remaining = Math.max(0, cp.totalCuts - cp.usedCuts)
                  const isChecked = watch('clientPackageId') === cp.id
                  return (
                    <label key={cp.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setValue('clientPackageId', e.target.checked ? cp.id : null)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                     />
                      <span>
                        Descontar corte do <strong>{cp.package.name}</strong> ({remaining} restantes)
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Serviço */}
          <div className="flex flex-col gap-2">
            <Label id="appointment-services-label" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><SystemIcon name="servicos-tesoura" />Serviço *</Label>
            <div className="relative">
              
              <div role="group" aria-labelledby="appointment-services-label" className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-2">
                {services?.map((s: any) => {
                  const checked = watch('serviceIds')?.includes(s.id)
                  return (
                    <label key={s.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        checked={checked}
                        onChange={() => {
                          const ids = watch('serviceIds') || []
                          setValue('serviceIds', checked ? ids.filter((id) => id !== s.id) : [...ids, s.id], { shouldValidate: true })
                        }}
                     />
                      <span className="min-w-0 flex-1 text-sm font-medium">{s.name}</span><span className="shrink-0 text-right text-sm font-semibold">{formatCurrency(s.price)}<span className="block text-xs font-normal text-muted-foreground">{s.durationMins} min</span></span>
                    </label>
                  )
                })}
              </div>
            </div>
            {errors.serviceIds && <p className="text-xs text-destructive">{errors.serviceIds.message}</p>}
            {selectedServices.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium">
                Total: {formatCurrency(totalPrice)} · {totalDuration} minutos
              </p>
            )}
          </div>

          {/* Barbeiro (Somente Admin) */}
          {user?.role === 'ADMIN' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="appointment-barber" className="text-sm font-semibold text-foreground">Barbeiro</Label>
              <div className="relative">
                <SystemIcon name="equipe" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                <Select onValueChange={(v) => setValue('barberId', v)} value={watch('barberId')}>
                  <SelectTrigger id="appointment-barber" className="pl-11">
                    <SelectValue placeholder="Sem preferência / Qualquer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer Barbeiro</SelectItem>
                    {/* Desativado não recebe agendamento novo; continua listado só se já for o barbeiro deste agendamento */}
                    {(Array.isArray(users) ? users : []).filter((u: any) => u.active !== false || u.id === watch('barberId')).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="appointment-date" className="text-sm font-semibold text-foreground">Data *</Label>
              <div className="relative">
                <SystemIcon name="agenda-horarios" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="appointment-date"
                  type="date"
                  disabled={isSubmitting}
                  {...register('date')}
                  className="pl-11"
               />
              </div>
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="appointment-time" className="text-sm font-semibold text-foreground">Horário *</Label>
              <div className="relative">
                <SystemIcon name="horarios-e-folgas" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="appointment-time"
                  type="time"
                  disabled={isSubmitting}
                  {...register('time')}
                  className="pl-11"
               />
              </div>
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="appointment-status" className="text-sm font-semibold text-foreground">Status</Label>
            <div className="relative">
              <SystemIcon name={watch('status') === 'CONFIRMED' ? 'confirmados' : watch('status') === 'COMPLETED' ? 'concluidos' : watch('status') === 'CANCELED' ? 'agenda-horarios' : 'pendentes'} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" />
              <Select onValueChange={(v) => setValue('status', v as any)} value={watch('status')}>
                <SelectTrigger id="appointment-status" className="pl-11">
                  <SelectValue placeholder="Selecione o status..." />
                </SelectTrigger>
                <SelectContent>
                  {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED'] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="appointment-notes" className="text-sm font-semibold text-foreground">Observações (opcional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="appointment-notes"
                {...register('notes')} maxLength={LIMITES.notas}
                disabled={isSubmitting}
                placeholder="Preferências, solicitações..."
                rows={2}
                className="pl-11 resize-none"
             />
            </div>
          </div>

          {/* Rodapé */}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {appointment ? 'Salvar Alterações' : 'Criar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
