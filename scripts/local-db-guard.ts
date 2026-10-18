// Recusa rodar comandos que escrevem ou apagam dados (seed, db push, migrate dev/reset, fixtures, testes)
// contra um banco que não seja local. Lê o .env do mesmo jeito que o Prisma CLI: variável já definida no
// processo tem precedência e não é sobrescrita.
import { config } from 'dotenv'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^\[|\]$/g, '')
  } catch {
    return ''
  }
}

export function assertLocalDatabase(command: string) {
  config({ quiet: true })
  const problems: string[] = []
  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL não definida')
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    const value = process.env[name]
    if (value && !LOCAL_HOSTS.has(hostOf(value))) problems.push(`${name} aponta para "${hostOf(value) || 'valor inválido'}"`)
  }
  if (problems.length) {
    console.error(`[guarda] "${command}" recusado: só roda contra banco local (localhost). ${problems.join('; ')}.`)
    process.exit(1)
  }
}
