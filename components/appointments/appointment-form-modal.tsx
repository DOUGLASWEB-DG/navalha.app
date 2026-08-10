'use client'

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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
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
      date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
    },
  })

  useEffect(() => {
    if (appointment) {
      const apptDate = new Date(appointment.date)
      reset({
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        barberId: appointment.barberId ?? 'any',
        date: format(apptDate, 'yyyy-MM-dd'),
        time: format(apptDate, 'HH:mm'),
        status: appointment.status,
        notes: appointment.notes ?? '',
      })
    } else {
      reset({
        status: 'PENDING',
        date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        clientId: '',
        serviceId: '',
        barberId: 'any',
        notes: '',
      })
    }
  }, [appointment, open, defaultDate, reset])

  async function onSubmit(data: FormData) {
    const datetime = new Date(`${data.date}T${data.time}:00`)

    try {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments'
      const method = appointment ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: data.clientId,
          serviceId: data.serviceId,
          barberId: data.barberId === 'any' ? undefined : data.barberId,
          date: datetime.toISOString(),
          status: data.status,
          notes: data.notes,
        }),
      })

      if (!res.ok) throw new Error('Falha na requisição')

      toast.success('Sucesso!', {
        description: appointment ? 'Agendamento atualizado.' : 'Agendamento criado.',
      })
      onSaved()
    } catch {
      toast.error('Erro', {
        description: 'Falha ao salvar agendamento.',
      })
    }
  }

  const selectedService = services?.find((s: any) => s.id === watch('serviceId'))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">
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
              <Select onValueChange={(v) => setValue('serviceId', v)} value={watch('serviceId')}>
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Selecione o serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — R${s.price.toFixed(2)} ({s.durationMins}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId.message}</p>}
            {selectedService && (
              <p className="text-xs text-muted-foreground font-medium">Tempo estimado: {selectedService.durationMins} minutos</p>
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
                    {users?.map((u: any) => (
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
                {...register('notes')}
                disabled={isSubmitting}
                placeholder="Preferências, solicitações..."
                rows={2}
                className="pl-9 resize-none"
              />
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {appointment ? 'Salvar Alterações' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
