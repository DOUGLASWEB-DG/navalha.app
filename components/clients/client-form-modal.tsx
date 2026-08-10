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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  client?: any
  onSaved: () => void
}

export function ClientFormModal({ open, onClose, client, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        phone: client.phone,
        email: client.email ?? '',
        notes: client.notes ?? '',
      })
    } else {
      reset({ name: '', phone: '', email: '', notes: '' })
    }
  }, [client, open, reset])

  async function onSubmit(data: FormData) {
    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha de validação.')
      }

      toast.success('Sucesso!', {
        description: client ? 'Cliente atualizado.' : 'Cliente adicionado.',
      })
      onSaved()
    } catch (err: any) {
      toast.error('Erro', {
        description: err.message || 'Falha ao salvar cliente.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Nome Completo *</Label>
            <Input
              {...register('name')}
              placeholder="João Silva"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Telefone / WhatsApp *</Label>
            <Input
              {...register('phone')}
              placeholder="(69) 99999-9999"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Email (opcional)</Label>
            <Input
              {...register('email')}
              type="email"
              placeholder="joao@email.com"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-foreground">Observações (opcional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Preferências, alergias, anotações..."
              rows={3}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              {isSubmitting && <Spinner className="w-3.5 h-3.5" />}
              {client ? 'Atualizar' : 'Adicionar'} Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
