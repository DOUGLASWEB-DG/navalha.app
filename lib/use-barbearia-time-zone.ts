'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Fuso IANA da barbearia logada, vindo de /api/auth/me (mesma chave SWR usada pelo menu e pela barra do
// topo, então não gera requisição extra). undefined enquanto carrega.
export function useBarbeariaTimeZone(): string | undefined {
  const { data } = useSWR('/api/auth/me', fetcher)
  return data?.timezone
}
