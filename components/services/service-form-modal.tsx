'use client'

import { useEffect, useRef, useState } from 'react'
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
import { Clock, DollarSign, Type, AlignLeft, ImagePlus, Trash2 } from 'lucide-react'

// Mesmos limites do servidor (lib/uploads/image.ts); o servidor continua sendo quem decide.
const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

  const fileInput = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)

  // Foto exibida: a escolhida agora, senão a já salva (a menos que o admin tenha marcado para remover)
  const shownPhoto = photoPreview ?? (removePhoto ? null : service?.imageUrl ?? null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function resetPhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      toast.error('Formato não suportado', { description: 'Envie uma foto JPEG, PNG ou WebP.' })
      event.target.value = ''
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Foto muito grande', { description: 'A foto pode ter no máximo 2 MB.' })
      event.target.value = ''
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
  }

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
    resetPhoto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, open, reset])

  async function onSubmit(data: FormData) {
    try {
      const url = service ? `/api/services/${service.id}` : '/api/services'
      const method = service ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          durationMins: parseInt(data.durationMins),
        }),
      })

      if (!res.ok) throw new Error('Falha ao salvar')
      const saved = await res.json()

      // A foto vai depois do cadastro (precisa do id). Se ela falhar, o serviço já está salvo.
      let photoError: string | null = null
      if (photoFile) {
        const body = new FormData()
        body.append('file', photoFile)
        const photoRes = await fetch(`/api/services/${saved.id}/image`, { method: 'POST', body })
        if (!photoRes.ok) {
          photoError = (await photoRes.json().catch(() => null))?.error ?? 'Falha ao enviar a foto.'
        }
      } else if (removePhoto && service?.imageUrl) {
        const photoRes = await fetch(`/api/services/${saved.id}/image`, { method: 'DELETE' })
        if (!photoRes.ok) photoError = 'Falha ao remover a foto.'
      }

      if (photoError) {
        toast.warning('Serviço salvo, mas a foto não foi atualizada', { description: photoError })
      } else {
        toast.success('Sucesso!', {
          description: service ? 'Serviço atualizado.' : 'Serviço adicionado.',
        })
      }
      onSaved()
    } catch {
      toast.error('Erro', {
        description: 'Falha ao salvar serviço.',
      })
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
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Foto do serviço</Label>
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                {shownPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPTED_PHOTO_TYPES.join(',')}
                  onChange={handlePhotoChange}
                  disabled={isSubmitting}
                  className="sr-only"
                  id="service-photo"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => fileInput.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  {shownPhoto ? 'Trocar foto' : 'Escolher foto'}
                </Button>
                {shownPhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      const hadSavedPhoto = !!service?.imageUrl
                      resetPhoto()
                      if (hadSavedPhoto) setRemovePhoto(true)
                    }}
                    className="gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remover foto
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP, até 2 MB.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Nome do Serviço *</Label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                {...register('name')} 
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
                {...register('description')} 
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
