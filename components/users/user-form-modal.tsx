'use client'

import { SystemIcon } from '@/components/shared/system-icon'

import { PERMISSION_DEFINITIONS, readPermissionOverrides } from '@/lib/permissions'
import { permissionOverridesSchema } from '@/lib/permission-schema'
import { LIMITES } from '@/lib/input-limits'
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
  DialogDescription,
  DialogFooter,
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
import { User, Mail, Lock, ShieldCheck, Percent } from 'lucide-react'
import { PhotoField, syncPhoto, usePhotoField } from '@/components/shared/photo-field'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'BARBER']),
  permissionOverrides: permissionOverridesSchema.default({}),
  commissionPercent: z.coerce.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').default(50),
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
    defaultValues: { role: 'BARBER', commissionPercent: 50, permissionOverrides: {} },
  })

  // Foto do barbeiro/admin (só o admin chega neste formulário)
  const photo = usePhotoField(user?.avatarUrl)

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        commissionPercent: user.commissionPercent ?? 50,
        permissionOverrides: readPermissionOverrides(user.permissionOverrides),
      })
    } else {
      reset({ name: '', email: '', role: 'BARBER', password: '', commissionPercent: 50, permissionOverrides: {} })
    }
    photo.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open, reset])

  async function onSubmit(data: FormData) {
    if (!user && !data.password) {
      toast.error('Defina uma senha', { description: 'Usuários novos precisam de uma senha para conseguir entrar.' })
      return
    }

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PATCH' : 'POST'

      const body: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        commissionPercent: Number(data.commissionPercent),
        permissionOverrides: data.role === 'BARBER' ? data.permissionOverrides : {},
      }

      if (data.password) {
        body.password = data.password
      }

      const saved = await apiRequest<{ id: string }>(url, { method, json: body })

      // A foto vai depois do cadastro (precisa do id). Se ela falhar, o usuário já está salvo.
      const sentPhoto = !!photo.file
      const removedPhoto = photo.remove && !!photo.savedUrl
      const photoError = await syncPhoto(`/api/users/${saved.id}/avatar`, photo)
      if (photoError) {
        toast.warning(user ? 'Usuário atualizado, mas a foto não foi salva' : 'Usuário criado, mas a foto não foi salva', {
          description: `${photoError} Abra o cadastro novamente para tentar enviar a foto.`,
          duration: 9000,
        })
      } else {
        toast.success(user ? 'Usuário atualizado' : 'Usuário criado', {
          description: sentPhoto
            ? 'A foto nova já aparece na Equipe e na página de agendamento.'
            : removedPhoto
              ? 'A foto foi removida.'
              : 'As alterações foram salvas.',
        })
      }
      onSaved()
    } catch (error) {
      showError(user ? 'Não foi possível atualizar o usuário' : 'Não foi possível criar o usuário', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-10 text-foreground"><SystemIcon name="equipe" className="h-8 w-8" /><span>{user ? 'Editar Usuário' : 'Novo Usuário (Barbeiro/Admin)'}</span></DialogTitle>
          <DialogDescription>Organize o acesso e os dados do profissional da equipe.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <PhotoField field={photo} label="Foto" inputId="user-photo" disabled={isSubmitting} round />

          {/* Nome */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome *</Label>
            <div className="relative">
              <SystemIcon name="equipe" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Input
                disabled={isSubmitting}
                {...register('name')} maxLength={LIMITES.nome}
                placeholder="Ex: João da Silva"
                className="pl-11"
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
                className="pl-11"
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
                className="pl-11"
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
                <SelectTrigger className="pl-11">
                  <SelectValue placeholder="Selecione o acesso..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARBER">Barbeiro (Apenas Agenda)</SelectItem>
                  <SelectItem value="ADMIN">Administrador (Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comissão (%) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Comissão de Repasse (%)</Label>
              <span className="text-xs text-muted-foreground">Sugestão: 20% a 75%</span>
            </div>
            <div className="relative">
              <SystemIcon name="comissoes" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                disabled={isSubmitting}
                {...register('commissionPercent')}
                placeholder="50"
                className="pl-11"
              />
            </div>
            {errors.commissionPercent && <p className="text-xs text-destructive">{errors.commissionPercent.message}</p>}
          </div>

          {/* Rodapé */}
          {watch('role') === 'BARBER' && <fieldset className="space-y-3 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Permissões deste profissional</legend>
            <p className="text-xs text-muted-foreground">Herdar usa o padrão da equipe. As exceções valem somente para este profissional e para a própria agenda.</p>
            {PERMISSION_DEFINITIONS.map(({ key, label }) => {
              const overrides = watch('permissionOverrides') ?? {}
              const value = overrides[key] === undefined ? 'inherit' : overrides[key] ? 'allow' : 'deny'
              return <label key={key} className="flex min-h-12 flex-col items-stretch justify-between gap-2 text-sm sm:flex-row sm:items-center">
                <span>{label}</span>
                <select value={value} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm sm:w-auto" onChange={event => {
                  const next = { ...overrides }
                  if (event.target.value === 'inherit') delete next[key]
                  else next[key] = event.target.value === 'allow'
                  setValue('permissionOverrides', next, { shouldDirty: true })
                }}>
                  <option value="inherit">Herdar da equipe</option><option value="allow">Permitir</option><option value="deny">Bloquear</option>
                </select>
              </label>
            })}
          </fieldset>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {user ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
