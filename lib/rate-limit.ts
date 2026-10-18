// Limitador de tentativas em memória.
// Válido para um único processo Node (VPS com `node server.js`). Contadores zeram ao reiniciar
// o processo e NÃO são compartilhados entre instâncias: com mais de uma réplica, migrar para
// armazenamento compartilhado (ex.: tabela no Postgres).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

function activeBucket(key: string, now: number) {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) return null
  return bucket
}

export type RateLimitRule = { key: string; limit: number; windowMs: number }

// Retorna os segundos até liberar se alguma regra já estourou; null se todas permitem.
export function checkLimited(rules: RateLimitRule[]): number | null {
  const now = Date.now()
  let retryAfterMs = 0
  for (const rule of rules) {
    const bucket = activeBucket(rule.key, now)
    if (bucket && bucket.count >= rule.limit) {
      retryAfterMs = Math.max(retryAfterMs, bucket.resetAt - now)
    }
  }
  return retryAfterMs > 0 ? Math.ceil(retryAfterMs / 1000) : null
}

// Registra uma ocorrência em cada regra (janela fixa iniciada na primeira ocorrência).
export function hit(rules: RateLimitRule[]) {
  const now = Date.now()
  if (buckets.size >= MAX_KEYS) sweepExpired(now)
  for (const rule of rules) {
    const bucket = activeBucket(rule.key, now)
    if (bucket) {
      bucket.count += 1
    } else if (buckets.size < MAX_KEYS) {
      buckets.set(rule.key, { count: 1, resetAt: now + rule.windowMs })
    }
  }
}

export function clear(keys: string[]) {
  for (const key of keys) buckets.delete(key)
}

// IP do cliente somente a partir de um header definido explicitamente em RATE_LIMIT_IP_HEADER,
// que deve ser um header sobrescrito pelo proxy da VPS (ex.: x-real-ip, cf-connecting-ip).
// Para x-forwarded-for usa a última entrada, que é a adicionada pelo proxy mais próximo.
// Sem a variável, retorna null e os limites por IP não são aplicados.
export function getClientIp(headers: Headers): string | null {
  const headerName = process.env.RATE_LIMIT_IP_HEADER?.trim().toLowerCase()
  if (!headerName) return null
  const value = headers.get(headerName)
  if (!value) return null
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
  const ip = headerName === 'x-forwarded-for' ? parts[parts.length - 1] : parts[0]
  return ip || null
}

export function tooManyRequestsHeaders(retryAfterSec: number) {
  return { 'Retry-After': String(retryAfterSec) }
}
