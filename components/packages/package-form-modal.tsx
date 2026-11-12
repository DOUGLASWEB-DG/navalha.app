'use client'

import { SystemIcon } from '@/components/shared/system-icon'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, DollarSign, Calendar, Scissors, User } from 'lucide-react'
import { apiRequest, apiFetcher } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço deve ser positivo'),
  totalCuts: z.coerce.number().int().min(1, 'Pelo menos 1 corte').default(4),
  validityDays: z.coerce.number().int().min(1, 'Pelo menos 1 dia').default(30),
  barberId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  pkg?: any
  onSaved: () => void
}

export function PackageFormModal({ open, onClose, pkg, onSaved }: Props) {
  const { data: usersData } = useSWR('/api/users', apiFetcher)
  const barbers = (usersData || []).filter((u: any) => u.active !== false && u.role === 'BARBER')

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
      name: '',
      price: 120,
      totalCuts: 4,
      validityDays: 30,
      barberId: 'all',
    },
  })

  useEffect(() => {
    if (pkg) {
      reset({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        totalCuts: pkg.totalCuts,
        validityDays: pkg.validityDays,
        barberId: pkg.barberId || 'all',
      })
    } else {
      reset({
        name: '',
        description: '',
        price: 120,
        totalCuts: 4,
        validityDays: 30,
        barberId: 'all',
      })
    }
  }, [pkg, open, reset])

  async function onSubmit(data: FormData) {
    try {
      const url = pkg ? `/api/packages/${pkg.id}` : '/api/packages'
      const method = pkg ? 'PATCH' : 'POST'

      const body = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        totalCuts: data.totalCuts,
        validityDays: data.validityDays,
        barberId: data.barberId === 'all' ? null : data.barberId,
      }

      await apiRequest(url, { method, json: body })
      toast.success(pkg ? 'Pacote atualizado' : 'Pacote criado com sucesso!')
      onSaved()
    } catch (error) {
      showError(pkg ? 'Não foi possível atualizar o pacote' : 'Não foi possível criar o pacote', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-10 text-foreground"><SystemIcon name="clube-de-assinatura-vip" className="h-8 w-8" /><span>{pkg ? 'Editar Modelo de Pacote' : 'Novo Modelo de Pacote'}</span></DialogTitle>
          <DialogDescription>Defina o pacote de cortes e suas condições de validade.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome do Pacote *</Label>
            <div className="relative">
              <SystemIcon name="produtos-estoque" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Input
                disabled={isSubmitting}
                {...register('name')}
                placeholder="Ex: Pacote 4 Cortes Mensal"
                className="pl-11"
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Preço e Total de Cortes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Preço Total (R$) *</Label>
              <div className="relative">
                <SystemIcon name="financeiro-caixa" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
                <Input
                  type="number"
                  step="0.01"
                  disabled={isSubmitting}
                  {...register('price')}
                  placeholder="120,00"
                  className="pl-11"
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Qtd. de Cortes *</Label>
              <div className="relative">
                <SystemIcon name="servicos-tesoura" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
                <Input
                  type="number"
                  min="1"
                  disabled={isSubmitting}
                  {...register('totalCuts')}
                  placeholder="4"
                  className="pl-11"
                />
              </div>
              {errors.totalCuts && <p className="text-xs text-destructive">{errors.totalCuts.message}</p>}
            </div>
          </div>

          {/* Validade em Dias e Barbeiro Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Validade (Dias) *</Label>
              <div className="relative">
                <SystemIcon name="agenda-horarios" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
                <Input
                  type="number"
                  min="1"
                  disabled={isSubmitting}
                  {...register('validityDays')}
                  placeholder="30"
                  className="pl-11"
                />
              </div>
              {errors.validityDays && <p className="text-xs text-destructive">{errors.validityDays.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Barbeiro Exclusivo</Label>
              <div className="relative">
                <SystemIcon name="equipe" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
                <Select onValueChange={(v) => setValue('barberId', v)} value={watch('barberId')}>
                  <SelectTrigger className="pl-11">
                    <SelectValue placeholder="Qualquer Barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer Barbeiro</SelectItem>
                    {barbers.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Descrição (opcional)</Label>
            <Textarea
              disabled={isSubmitting}
              {...register('description')}
              placeholder="Ex: Válido de terça a quinta, inclui lavagem..."
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {pkg ? 'Salvar Alterações' : 'Criar Pacote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
