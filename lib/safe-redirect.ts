const BASE = 'http://navalha.invalid'

// Aceita somente caminhos internos. Usa o parser de URL (mesmas regras do navegador) para barrar
// variações como "//host", "/\host" ou "/<tab>/host", que o navegador trataria como outro domínio.
export function safeRedirect(value: string | null, fallback = '/dashboard') {
  if (!value || !value.startsWith('/')) return fallback
  try {
    const url = new URL(value, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
