// Interpretação do Host da requisição para descobrir a barbearia (tenant).
// Funções puras: sem banco e sem Next, para poderem ser testadas isoladamente e usadas pelo seed.

// Barbearia que recebeu todos os dados existentes na migration 20261018130000_bloco2_multitenant_base.
// Precisa continuar igual ao INSERT daquela migration.
export const DEFAULT_BARBEARIA_ID = 'barbearia-america'

// Mesma lista do CHECK "Barbearia_subdomain_reserved_check" (migration do Bloco 2).
export const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'painel', 'login', 'static', 'mail'])

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/

export type TenantHost =
  | { kind: 'subdomain'; subdomain: string }
  | { kind: 'customDomain'; domain: string }
  | { kind: 'none'; reason: 'invalid' | 'platform-root' | 'reserved' | 'nested' | 'ip' }

// Forma canônica do host: minúsculas, sem porta e sem o ponto final do FQDN.
// Retorna null para qualquer coisa que não seja um nome DNS válido (inclui IPv6 literal).
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null
  let host = raw.trim().toLowerCase()
  if (host.startsWith('[')) return null
  const colon = host.lastIndexOf(':')
  if (colon !== -1) {
    if (!/^\d{1,5}$/.test(host.slice(colon + 1))) return null
    host = host.slice(0, colon)
  }
  if (host.endsWith('.')) host = host.slice(0, -1)
  if (!host || host.length > 253) return null
  if (!host.split('.').every((label) => LABEL_RE.test(label))) return null
  return host
}

// Hosts sob o domínio da plataforma são resolvidos SOMENTE pelo subdomínio; qualquer outro host só pode
// ser um domínio próprio. Assim um customDomain nunca concorre com um subdomínio da plataforma.
export function parseTenantHost(rawHost: string | null | undefined, rootDomain: string | null): TenantHost {
  const host = normalizeHost(rawHost)
  if (!host) return { kind: 'none', reason: 'invalid' }

  if (rootDomain) {
    if (host === rootDomain) return { kind: 'none', reason: 'platform-root' }
    if (host.endsWith(`.${rootDomain}`)) {
      const label = host.slice(0, -(rootDomain.length + 1))
      if (label.includes('.')) return { kind: 'none', reason: 'nested' }
      if (RESERVED_SUBDOMAINS.has(label)) return { kind: 'none', reason: 'reserved' }
      if (!SUBDOMAIN_RE.test(label)) return { kind: 'none', reason: 'invalid' }
      return { kind: 'subdomain', subdomain: label }
    }
  }

  if (IPV4_RE.test(host)) return { kind: 'none', reason: 'ip' }
  if (!host.includes('.')) return { kind: 'none', reason: 'invalid' }
  return { kind: 'customDomain', domain: host }
}

// Domínio da plataforma. Em produção precisa ser explícito (TENANT_ROOT_DOMAIN=navalha.app); sem ele só
// domínios próprios funcionam. Fora de produção o padrão é "localhost" (america.localhost:3000).
// DECISÃO PENDENTE: o próprio domínio raiz (navalha.app) responde 404 até existir a página da plataforma.
export function getTenantRootDomain(env: NodeJS.ProcessEnv = process.env): string | null {
  const configured = env.TENANT_ROOT_DOMAIN?.trim()
  if (configured) return normalizeHost(configured)
  return env.NODE_ENV === 'production' ? null : 'localhost'
}

// Tenant fixo para ambientes de preview (ex.: *.vercel.app), onde não há subdomínio por barbearia.
// Nunca vale em produção: na VPS NODE_ENV=production sem VERCEL_ENV; na Vercel, VERCEL_ENV=production.
export function getFixedSubdomain(env: NodeJS.ProcessEnv = process.env): string | null {
  const fixed = env.TENANT_FIXED_SUBDOMAIN?.trim().toLowerCase()
  if (!fixed) return null
  const allowed = env.VERCEL_ENV === 'preview' || (env.NODE_ENV !== 'production' && env.VERCEL_ENV !== 'production')
  if (!allowed) {
    console.error('[Tenant] TENANT_FIXED_SUBDOMAIN ignorado: só é permitido fora de produção.')
    return null
  }
  return SUBDOMAIN_RE.test(fixed) && !RESERVED_SUBDOMAINS.has(fixed) ? fixed : null
}
