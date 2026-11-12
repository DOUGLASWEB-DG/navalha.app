'use client'

import { SystemIcon } from '@/components/shared/system-icon'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Target, Type, Calendar, DollarSign } from 'lucide-react'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  type: z.enum(['REVENUE', 'CLIENTS', 'APPOINTMENTS']),
  targetAmount: z.string().min(1, 'Meta é obrigatória'),
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function GoalFormModal({ open, onClose, onSaved }: Props) {
  // Períodos padrão (mês, semana, dia) a partir de hoje no relógio da barbearia
  const timeZone = useBarbeariaTimeZone()
  const now = toZonedWallClock(new Date(), timeZone)
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
      type: 'REVENUE',
      period: 'monthly',
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    },
  })

  const period = watch('period')

  useEffect(() => {
    if (open) {
      const n = toZonedWallClock(new Date(), timeZone)
      reset({
        title: '',
        type: 'REVENUE',
        period: 'monthly',
        targetAmount: '',
        startDate: format(startOfMonth(n), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(n), 'yyyy-MM-dd'),
      })
    }
  }, [open, reset, timeZone])

  // Auto-definir datas baseado no período
  useEffect(() => {
    const n = toZonedWallClock(new Date(), timeZone)
    if (period === 'monthly') {
      setValue('startDate', format(startOfMonth(n), 'yyyy-MM-dd'))
      setValue('endDate', format(endOfMonth(n), 'yyyy-MM-dd'))
    } else if (period === 'daily') {
      setValue('startDate', format(n, 'yyyy-MM-dd'))
      setValue('endDate', format(n, 'yyyy-MM-dd'))
    } else if (period === 'weekly') {
      const start = new Date(n)
      start.setDate(n.getDate() - n.getDay() + 1)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      setValue('startDate', format(start, 'yyyy-MM-dd'))
      setValue('endDate', format(end, 'yyyy-MM-dd'))
    }
  }, [period, setValue, timeZone])

  async function onSubmit(data: FormData) {
    try {
      await apiRequest('/api/goals', {
        method: 'POST',
        json: { ...data, targetAmount: parseFloat(data.targetAmount) },
      })

      toast.success('Meta criada', { description: 'Acompanhe o progresso dela no painel.' })
      onSaved()
    } catch (error) {
      showError('Não foi possível criar a meta', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-10 text-foreground"><SystemIcon name="metas-desempenho" className="h-8 w-8" /><span>Criar Nova Meta</span></DialogTitle>
          <DialogDescription>Defina o objetivo e o período que deseja acompanhar.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Título da Meta *</Label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('title')}
                disabled={isSubmitting}
                placeholder="Ex: Meta de Receita Mensal"
                className="pl-11"
              />
            </div>
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Tipo de Meta *</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select onValueChange={(v: string) => setValue('type', v as any)} value={watch('type')}>
                  <SelectTrigger className="pl-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVENUE">Receita (R$)</SelectItem>
                    <SelectItem value="CLIENTS">Novos Clientes</SelectItem>
                    <SelectItem value="APPOINTMENTS">Agendamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Período *</Label>
              <div className="relative">
                <SystemIcon name="agenda-horarios" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
                <Select onValueChange={(v: string) => setValue('period', v as any)} value={watch('period')}>
                  <SelectTrigger className="pl-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Valor da Meta *</Label>
            <div className="relative">
              <SystemIcon name="financeiro-caixa" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none"  />
              <Input
                {...register('targetAmount')}
                disabled={isSubmitting}
                type="number"
                step="1"
                min="1"
                placeholder="Ex: 3000"
                className="pl-11 font-medium"
              />
            </div>
            {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Data Início</Label>
              <div className="relative">
                <Input
                  type="date"
                  {...register('startDate')}
                  disabled={isSubmitting}
                  className="pl-3"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Data Fim</Label>
              <div className="relative">
                <Input
                  type="date"
                  {...register('endDate')}
                  disabled={isSubmitting}
                  className="pl-3"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              Criar Meta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
