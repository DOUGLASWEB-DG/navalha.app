'use client'

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
  const now = new Date()
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
      const n = new Date()
      reset({
        title: '',
        type: 'REVENUE',
        period: 'monthly',
        targetAmount: '',
        startDate: format(startOfMonth(n), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(n), 'yyyy-MM-dd'),
      })
    }
  }, [open, reset])

  // Auto-definir datas baseado no período
  useEffect(() => {
    const n = new Date()
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
  }, [period, setValue])

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          targetAmount: parseFloat(data.targetAmount),
        }),
      })

      if (!res.ok) throw new Error('Falha ao salvar')
      toast.success('Sucesso!', { description: 'Meta criada com sucesso.' })
      onSaved()
    } catch {
      toast.error('Erro', { description: 'Falha ao criar meta.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">Criar Nova Meta</DialogTitle>
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
                className="pl-9"
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
                  <SelectTrigger className="pl-9">
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
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select onValueChange={(v: string) => setValue('period', v as any)} value={watch('period')}>
                  <SelectTrigger className="pl-9">
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
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                {...register('targetAmount')}
                disabled={isSubmitting}
                type="number"
                step="1"
                min="1"
                placeholder="Ex: 3000"
                className="pl-9 font-medium"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              Criar Meta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
