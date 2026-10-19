'use client'

import { toast } from 'sonner'
import { errorMessage, HttpError, isSessionExpired } from '@/lib/http-errors'

let redirectingToLogin = false

// Sessão vencida (o login vale 8 horas): avisa e leva o usuário ao login, uma única vez, em vez de deixar
// as telas mostrando listas vazias ou "Erro" genérico.
export function handleSessionExpired() {
  if (redirectingToLogin || typeof window === 'undefined') return
  redirectingToLogin = true
  toast.error('Sua sessão expirou', { description: 'Estamos levando você para a tela de login.' })
  window.setTimeout(() => {
    window.location.href = '/login'
  }, 1800)
}

// Erro de uma ação do usuário (salvar, excluir, confirmar...): título diz o que falhou; descrição diz o motivo
// e o que fazer. O texto técnico do servidor vai só para o console.
export function showError(title: string, error: unknown, fallback?: string) {
  if (error instanceof HttpError && error.serverMessage) {
    console.error(`[${title}] HTTP ${error.status}: ${error.serverMessage}`)
  } else if (!(error instanceof HttpError)) {
    console.error(`[${title}]`, error)
  }
  if (isSessionExpired(error)) {
    handleSessionExpired()
    return
  }
  toast.error(title, { description: errorMessage(error, fallback) })
}
