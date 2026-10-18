import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getFixedSubdomain, getTenantRootDomain, parseTenantHost } from '@/lib/tenant-host'

export { DEFAULT_BARBEARIA_ID } from '@/lib/tenant-host'

export type TenantBarbearia = { id: string; name: string; subdomain: string; timezone: string }

export class TenantNotFoundError extends Error {
  constructor() {
    super('Barbearia não encontrada.')
    this.name = 'TenantNotFoundError'
  }
}

// Cache em memória (a VPS roda um único processo). Também guarda "não encontrado", para que subdomínios
// inventados não virem uma consulta ao banco cada. Desativar uma barbearia leva até CACHE_TTL_MS para valer.
const CACHE_TTL_MS = 30_000
const CACHE_MAX_ENTRIES = 500
const cache = new Map<string, { value: TenantBarbearia | null; expiresAt: number }>()

const tenantSelect = { id: true, name: true, subdomain: true, timezone: true } as const

// Barbearia ativa dona do host, ou null. Nunca cai na barbearia padrão.
export async function resolveBarbeariaByHost(rawHost: string | null | undefined): Promise<TenantBarbearia | null> {
  const fixed = getFixedSubdomain()
  const parsed = fixed ? { kind: 'subdomain' as const, subdomain: fixed } : parseTenantHost(rawHost, getTenantRootDomain())
  if (parsed.kind === 'none') return null

  const key = parsed.kind === 'subdomain' ? `s:${parsed.subdomain}` : `d:${parsed.domain}`
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.value

  const value = await prisma.barbearia.findFirst({
    where: parsed.kind === 'subdomain'
      ? { subdomain: parsed.subdomain, active: true }
      : { customDomain: parsed.domain, active: true },
    select: tenantSelect,
  })
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
  return value
}

// Barbearia da requisição atual, pelo Host. O proxy da VPS precisa repassar o Host original.
export async function getCurrentBarbearia(): Promise<TenantBarbearia> {
  const requestHeaders = await headers()
  const barbearia = await resolveBarbeariaByHost(requestHeaders.get('host'))
  if (!barbearia) throw new TenantNotFoundError()
  return barbearia
}

export async function getCurrentBarbeariaId(): Promise<string> {
  return (await getCurrentBarbearia()).id
}
