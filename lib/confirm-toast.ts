import { toast } from 'sonner'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

/** Substitui `window.confirm` por toast com ações (estilo app nativo). */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const { title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = options

  return new Promise((resolve) => {
    const id = toast(title, {
      description,
      duration: Infinity,
      action: {
        label: confirmLabel,
        onClick: () => {
          toast.dismiss(id)
          resolve(true)
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => {
          toast.dismiss(id)
          resolve(false)
        },
      },
    })
  })
}
