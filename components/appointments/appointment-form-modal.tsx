'use client'

import { LIMITES } from '@/lib/input-limits'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import useSWR from 'swr'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { User, Scissors, CalendarDays, Clock, FileText, Activity } from 'lucide-react'
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
    },
  })

  useEffect(() => {
    if (appointment) {
      const apptDate = toZonedWallClock(appointment.date, timeZone)
      reset({
        clientId: appointment.clientId,
        serviceIds: appointment.appointmentServices?.map((item: any) => item.serviceId) || [appointment.serviceId],
        barberId: appointment.barberId ?? 'any',
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
        barberId: 'any',
        notes: '',
      })
    }
    // timeZone entra nas dependências: se o fuso chegar depois da abertura, o formulário é refeito com ele
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, open, defaultDate, reset, timeZone])

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
          <DialogTitle className="text-foreground ">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
          {/* Cliente */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Cliente *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select onValueChange={(v) => setValue('clientId', v)} value={watch('clientId')}>
                <SelectTrigger className="pl-9">
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
          </div>

          {/* Serviço */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Serviço *</Label>
            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <div className="flex flex-col gap-2 rounded-lg border border-border p-2">
                {services?.map((s: any) => {
                  const checked = watch('serviceIds')?.includes(s.id)
                  return (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const ids = watch('serviceIds') || []
                          setValue('serviceIds', checked ? ids.filter((id) => id !== s.id) : [...ids, s.id], { shouldValidate: true })
                        }}
                      />
                      <span className="text-sm">{s.name} — R${s.price.toFixed(2)} ({s.durationMins}min)</span>
                    </label>
                  )
                })}
              </div>
            </div>
            {errors.serviceIds && <p className="text-xs text-destructive">{errors.serviceIds.message}</p>}
            {selectedServices.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium">
                Total: R${totalPrice.toFixed(2)} · {totalDuration} minutos
              </p>
            )}
          </div>

          {/* Barbeiro (Somente Admin) */}
          {user?.role === 'ADMIN' && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Barbeiro</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select onValueChange={(v) => setValue('barberId', v)} value={watch('barberId')}>
                  <SelectTrigger className="pl-9">
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
              <Label className="text-sm font-semibold text-foreground">Data *</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  disabled={isSubmitting}
                  {...register('date')}
                  className="pl-9"
                />
              </div>
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Horário *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  disabled={isSubmitting}
                  {...register('time')}
                  className="pl-9"
                />
              </div>
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Status</Label>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select onValueChange={(v) => setValue('status', v as any)} value={watch('status')}>
                <SelectTrigger className="pl-9">
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
            <Label className="text-sm font-semibold text-foreground">Observações (opcional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                {...register('notes')} maxLength={LIMITES.notas}
                disabled={isSubmitting}
                placeholder="Preferências, solicitações..."
                rows={2}
                className="pl-9 resize-none"
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
