'use client'

import { SWRConfig } from 'swr'
import { handleSessionExpired } from '@/lib/feedback'
import { HttpError, isSessionExpired } from '@/lib/http-errors'

// Regras de erro das leituras do painel: sessão vencida leva ao login, e erros que não mudam ao tentar de
// novo (sem permissão, não encontrado) não ficam sendo repetidos em segundo plano.
export function DashboardSWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        onError: (error) => {
          if (isSessionExpired(error)) handleSessionExpired()
        },
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (error instanceof HttpError && [401, 403, 404].includes(error.status)) return
          if (retryCount >= 3) return
          window.setTimeout(() => revalidate({ retryCount }), 5000 * 2 ** retryCount)
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
