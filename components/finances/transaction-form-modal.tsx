'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import useSWR from 'swr'
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
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
})

type FormData = z.infer<typeof schema>

// Categorias fallback caso a API não retorne
const INCOME_CATEGORIES = ['Serviço', 'Produto', 'Gorjeta', 'Outros']
const EXPENSE_CATEGORIES = ['Materiais', 'Aluguel', 'Equipamentos', 'Marketing', 'Utilidades', 'Outros']

interface Props {
  open: boolean
  defaultType: 'INCOME' | 'EXPENSE'
  onClose: () => void
  onSaved: () => void
}

export function TransactionFormModal({ open, defaultType, onClose, onSaved }: Props) {
  // Buscar categorias do banco
  const { data: dbCategories } = useSWR('/api/finances/categories', fetcher)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const currentType = watch('type')

  // Filtrar categorias por tipo
  const filteredCategories = dbCategories
    ? (dbCategories as any[]).filter((c: any) =>
        c.type === 'BOTH' ||
        (currentType === 'INCOME' && c.type === 'INCOME') ||
        (currentType === 'EXPENSE' && c.type === 'EXPENSE')
      )
    : null

  // Fallback para categorias estáticas
  const fallbackCategories = currentType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    reset({
      type: defaultType,
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      description: '',
      category: '',
      categoryId: '',
    })
  }, [open, defaultType, reset])

  function handleCategoryChange(value: string) {
    // Se o valor começa com "id:", é uma categoria do banco
    if (value.startsWith('id:')) {
      const catId = value.replace('id:', '')
      const cat = filteredCategories?.find((c: any) => c.id === catId)
      setValue('categoryId', catId)
      setValue('category', cat?.name || '')
    } else {
      setValue('categoryId', '')
      setValue('category', value)
    }
  }

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
        }),
      })

      if (!res.ok) throw new Error('Falha ao salvar')

      toast.success('Sucesso!', {
        description: `${data.type === 'INCOME' ? 'Receita' : 'Despesa'} registrada com sucesso.`,
      })
      onSaved()
    } catch {
      toast.error('Erro', {
        description: 'Falha ao salvar transação.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">
            {defaultType === 'INCOME' ? 'Nova Receita' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Tipo</Label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setValue('type', 'INCOME')}
                className={cn(
                  'flex-1 min-h-12 rounded-xl border py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                  currentType === 'INCOME'
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400'
                    : 'border-border bg-card text-muted-foreground hover:text-muted-foreground'
                )}
              >
                Receita
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setValue('type', 'EXPENSE')}
                className={cn(
                  'flex-1 min-h-12 rounded-xl border py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                  currentType === 'EXPENSE'
                    ? 'border-red-400/40 bg-red-500/15 text-red-400'
                    : 'border-border bg-card text-muted-foreground hover:text-muted-foreground'
                )}
              >
                Despesa
              </button>
            </div>
          </div>

          {/* Valor */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Valor *</Label>
            <Input
              {...register('amount')}
              disabled={isSubmitting}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Descrição *</Label>
            <Input
              {...register('description')}
              disabled={isSubmitting}
              placeholder="Ex: Corte de cabelo, Compra de materiais"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Categoria</Label>
            <Select onValueChange={handleCategoryChange} value={watch('categoryId') ? `id:${watch('categoryId')}` : watch('category')}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories && filteredCategories.length > 0 ? (
                  // Categorias do banco com cores
                  filteredCategories.map((c: any) => (
                    <SelectItem
                      key={c.id}
                      value={`id:${c.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  // Fallback para categorias estáticas
                  fallbackCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Data *</Label>
            <Input
              type="date"
              disabled={isSubmitting}
              {...register('date')}
              className="bg-input border-border text-foreground"
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar Transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
