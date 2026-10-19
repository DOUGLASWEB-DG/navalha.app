'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Campo de foto dos formulários (serviço e usuário). Mesmos limites do servidor (lib/uploads/image.ts);
// o servidor continua sendo quem decide.
const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function usePhotoField(savedUrl: string | null | undefined) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [remove, setRemove] = useState(false)

  // Foto exibida: a escolhida agora, senão a já salva (a menos que tenha sido marcada para remover)
  const shown = preview ?? (remove ? null : savedUrl ?? null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function reset() {
    setFile(null)
    setPreview(null)
    setRemove(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    if (!ACCEPTED_PHOTO_TYPES.includes(chosen.type)) {
      toast.error('Formato não suportado', { description: 'Envie uma foto JPEG, PNG ou WebP.' })
      event.target.value = ''
      return
    }
    if (chosen.size > MAX_PHOTO_BYTES) {
      toast.error('Foto muito grande', { description: 'A foto pode ter no máximo 2 MB.' })
      event.target.value = ''
      return
    }
    setFile(chosen)
    setPreview(URL.createObjectURL(chosen))
    setRemove(false)
  }

  function clear() {
    const hadSavedPhoto = !!savedUrl
    reset()
    if (hadSavedPhoto) setRemove(true)
  }

  return { inputRef, file, shown, remove, savedUrl: savedUrl ?? null, reset, choose, clear }
}

export type PhotoFieldState = ReturnType<typeof usePhotoField>

// Envia ou remove a foto depois que o cadastro foi salvo (a rota precisa do id).
// Devolve a mensagem de erro, ou null quando deu certo ou não havia nada a fazer.
export async function syncPhoto(endpoint: string, field: PhotoFieldState): Promise<string | null> {
  if (field.file) {
    const body = new FormData()
    body.append('file', field.file)
    const res = await fetch(endpoint, { method: 'POST', body })
    if (!res.ok) return (await res.json().catch(() => null))?.error ?? 'Falha ao enviar a foto.'
  } else if (field.remove && field.savedUrl) {
    const res = await fetch(endpoint, { method: 'DELETE' })
    if (!res.ok) return 'Falha ao remover a foto.'
  }
  return null
}

interface PhotoFieldProps {
  field: PhotoFieldState
  label: string
  inputId: string
  disabled?: boolean
  round?: boolean // avatar de pessoa: redondo
}

export function PhotoField({ field, label, inputId, disabled, round }: PhotoFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="flex items-center gap-4">
        <div className={cn(
          'relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted',
          round ? 'rounded-full' : 'rounded-2xl'
        )}>
          {field.shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={field.shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <input
            ref={field.inputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(',')}
            onChange={field.choose}
            disabled={disabled}
            className="sr-only"
            id={inputId}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => field.inputRef.current?.click()}
            className="gap-2"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {field.shown ? 'Trocar foto' : 'Escolher foto'}
          </Button>
          {field.shown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={field.clear}
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
  )
}
