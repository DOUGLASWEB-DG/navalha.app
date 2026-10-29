'use client'

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
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Clock, DollarSign, Type, AlignLeft } from 'lucide-react'
import { PhotoField, syncPhoto, usePhotoField } from '@/components/shared/photo-field'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.string().min(1, 'Preço é obrigatório'),
  durationMins: z.string().min(1, 'Duração é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  service?: any
  onSaved: () => void
}

export function ServiceFormModal({ open, onClose, service, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const photo = usePhotoField(service?.imageUrl)

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description ?? '',
        price: String(service.price),
        durationMins: String(service.durationMins),
      })
    } else {
      reset({ name: '', description: '', price: '', durationMins: '30' })
    }
    photo.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, open, reset])

  async function onSubmit(data: FormData) {
    try {
      const url = service ? `/api/services/${service.id}` : '/api/services'
      const method = service ? 'PATCH' : 'POST'

      const saved = await apiRequest<{ id: string }>(url, {
        method,
        json: {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          durationMins: parseInt(data.durationMins),
        },
      })

      // A foto vai depois do cadastro (precisa do id). Se ela falhar, o serviço já está salvo.
      const sentPhoto = !!photo.file
      const removedPhoto = photo.remove && !!photo.savedUrl
      const photoError = await syncPhoto(`/api/services/${saved.id}/image`, photo)

      if (photoError) {
        toast.warning(service ? 'Serviço atualizado, mas a foto não foi salva' : 'Serviço adicionado, mas a foto não foi salva', {
          description: `${photoError} Abra o serviço novamente para tentar enviar a foto.`,
          duration: 9000,
        })
      } else {
        toast.success(service ? 'Serviço atualizado' : 'Serviço adicionado', {
          description: sentPhoto
            ? 'A foto nova já aparece na página de agendamento.'
            : removedPhoto
              ? 'A foto foi removida.'
              : 'As alterações foram salvas.',
        })
      }
      onSaved()
    } catch (error) {
      showError(service ? 'Não foi possível atualizar o serviço' : 'Não foi possível adicionar o serviço', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground ">
            {service ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
          <PhotoField field={photo} label="Foto do serviço" inputId="service-photo" disabled={isSubmitting} />

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome do Serviço *</Label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                {...register('name')} maxLength={LIMITES.nome} 
                disabled={isSubmitting} 
                placeholder="Ex: Corte Clássico" 
                className="pl-9" 
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Descrição</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea 
                {...register('description')} maxLength={LIMITES.descricao} 
                disabled={isSubmitting} 
                placeholder="Breve descrição do serviço..." 
                rows={3} 
                className="pl-9 resize-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Preço *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  {...register('price')} 
                  disabled={isSubmitting} 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="35,00" 
                  className="pl-9 font-medium" 
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">Duração *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  {...register('durationMins')} 
                  disabled={isSubmitting} 
                  type="number" 
                  min="5" 
                  placeholder="30" 
                  className="pl-9" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                  min
                </span>
              </div>
              {errors.durationMins && <p className="text-xs text-destructive">{errors.durationMins.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              {service ? 'Salvar Alterações' : 'Adicionar Serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
