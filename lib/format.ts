export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function normalizeBrazilPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits
  return null
}

export function formatBrazilPhone(value: string): string {
  const normalized = normalizeBrazilPhone(value)
  if (!normalized) return value

  const local = normalized.slice(2)
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
}

export function getInitial(value: string | null | undefined): string {
  const firstCharacter = value?.trim().normalize('NFC').slice(0, 1)
  return firstCharacter ? firstCharacter.toLocaleUpperCase('pt-BR') : '?'
}
