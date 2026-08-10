'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Package, DollarSign, FileText, Hash } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço inválido'),
  stock: z.number().min(0, 'Estoque inválido'),
  active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  product?: any
  onSaved: () => void
}

export function ProductFormModal({ open, onClose, product, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { active: true, stock: 0 },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        active: product.active,
      })
    } else {
      reset({ name: '', description: '', price: 0, stock: 0, active: true })
    }
  }, [product, open, reset])

  async function onSubmit(data: FormData) {
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Falha na requisição')

      toast.success('Sucesso!', {
        description: product ? 'Produto atualizado.' : 'Produto criado.',
      })
      onSaved()
    } catch {
      toast.error('Erro', {
        description: 'Falha ao salvar produto.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome *</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                disabled={isSubmitting}
                {...register('name')}
                placeholder="Pomada Modeladora..."
                className="pl-9"
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Preço */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Preço (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="number"
                  step="0.01"
                  disabled={isSubmitting}
                  {...register('price', { valueAsNumber: true })}
                  className="pl-9"
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            {/* Estoque */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Estoque *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="number"
                  disabled={isSubmitting}
                  {...register('stock', { valueAsNumber: true })}
                  className="pl-9"
                />
              </div>
              {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Descrição</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Textarea
                disabled={isSubmitting}
                {...register('description')}
                placeholder="Detalhes sobre o produto..."
                rows={2}
                className="pl-9 resize-none"
              />
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">Produto Ativo</Label>
              <p className="text-xs text-muted-foreground">Disponível para vendas.</p>
            </div>
            <Switch
              checked={watch('active')}
              onCheckedChange={(c: boolean) => setValue('active', c)}
              disabled={isSubmitting}
            />
          </div>

          {/* Rodapé */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {product ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
