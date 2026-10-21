import { toast } from 'sonner'

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  // 'danger': ação que apaga, cancela ou desativa (botão vermelho). 'default': ação positiva (cor principal).
  tone?: 'danger' | 'default'
}

const ACTION_BUTTON_STYLE = {
  danger: { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' },
  default: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
} as const

/** Substitui `window.confirm` por toast com ações (estilo app nativo). */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const { title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'default' } = options

  return new Promise((resolve) => {
    const id = toast(title, {
      description,
      duration: Infinity,
      actionButtonStyle: ACTION_BUTTON_STYLE[tone],
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
