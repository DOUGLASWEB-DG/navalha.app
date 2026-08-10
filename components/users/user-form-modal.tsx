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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Mail, Lock, ShieldCheck } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'BARBER']),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  user?: any
  onSaved: () => void
}

export function UserFormModal({ open, onClose, user, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BARBER' },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      })
    } else {
      reset({ name: '', email: '', role: 'BARBER', password: '' })
    }
  }, [user, open, reset])

  async function onSubmit(data: FormData) {
    if (!user && !data.password) {
      toast.error('Erro', { description: 'A senha é obrigatória para novos usuários' })
      return
    }

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PATCH' : 'POST'

      const body: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      }

      if (data.password) {
        body.password = data.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Falha na requisição')
      }

      toast.success('Sucesso!', {
        description: user ? 'Usuário atualizado.' : 'Usuário criado.',
      })
      onSaved()
    } catch (err: any) {
      toast.error('Erro', {
        description: err.message || 'Falha ao salvar usuário.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">
            {user ? 'Editar Usuário' : 'Novo Usuário (Barbeiro/Admin)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                disabled={isSubmitting}
                {...register('name')}
                placeholder="Ex: João da Silva"
                className="pl-9"
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">E-mail *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="email"
                disabled={isSubmitting}
                {...register('email')}
                placeholder="joao@barbearia.com"
                className="pl-9"
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">
              Senha {user ? '(Deixe em branco para não alterar)' : '*'}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="password"
                disabled={isSubmitting}
                {...register('password')}
                placeholder="******"
                className="pl-9"
              />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Tipo de Acesso *</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select onValueChange={(v) => setValue('role', v as any)} value={watch('role')}>
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Selecione o acesso..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARBER">Barbeiro (Apenas Agenda)</SelectItem>
                  <SelectItem value="ADMIN">Administrador (Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {user ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
