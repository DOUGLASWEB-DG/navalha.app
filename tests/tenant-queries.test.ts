// Falha se alguma rota ou lib chamar o Prisma sobre uma tabela de barbearia sem mencionar barbeariaId nos
// argumentos. É uma checagem textual (não executa nada): pega o esquecimento comum, não prova a lógica.
// A prova de comportamento é a suíte tests/integration/isolation.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['app/api', 'lib']

// Tabelas com barbeariaId. AppointmentService não tem: herda a barbearia pelo agendamento.
const TENANT_MODELS = ['user', 'client', 'service', 'appointment', 'transaction', 'category', 'financeAlert', 'goal', 'product']

// Exceções conferidas à mão. Chave: "arquivo modelo.operação". Toda entrada precisa de motivo.
const ALLOWED: Record<string, string> = {
  'app/api/auth/login/route.ts user.findUnique': 'busca por e-mail (único no sistema todo); a barbearia do usuário é conferida logo depois',
  'app/api/users/route.ts user.findUnique': 'checagem de e-mail já usado: o e-mail é único no sistema todo, não por barbearia',
  'app/api/users/[id]/route.ts user.findUnique': 'checagem de e-mail já usado: o e-mail é único no sistema todo, não por barbearia',
}

interface PrismaCall { file: string; model: string; op: string; args: string; line: number }

// Texto dos argumentos da chamada, do "(" até o ")" correspondente (ignora parênteses em strings).
function readArgs(source: string, openIndex: number): string {
  let depth = 0
  let quote: string | null = null
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '(') depth += 1
    else if (ch === ')' && --depth === 0) return source.slice(openIndex + 1, i)
  }
  return source.slice(openIndex + 1)
}

export function findPrismaCalls(source: string, file: string): PrismaCall[] {
  const calls: PrismaCall[] = []
  const pattern = new RegExp(`\\b(?:prisma|tx)\\.(${TENANT_MODELS.join('|')})\\.(\\w+)\\(`, 'g')
  for (const match of source.matchAll(pattern)) {
    const openIndex = match.index! + match[0].length - 1
    calls.push({
      file,
      model: match[1],
      op: match[2],
      args: readArgs(source, openIndex),
      line: source.slice(0, match.index).split('\n').length,
    })
  }
  return calls
}

function listFiles(dir: string): string[] {
  const full = path.join(ROOT, dir)
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(rel)
    return /\.tsx?$/.test(entry.name) ? [rel] : []
  })
}

test('o detector pega uma consulta sem barbeariaId (controle negativo)', () => {
  const bad = `const x = await prisma.client.findMany({ where: { isActive: true } })`
  const good = `const x = await prisma.client.findMany({ where: { barbeariaId, isActive: true } })`
  const nested = `await tx.appointment.update({ where: { id, barbeariaId: b.id }, data: { notes: fn(a, (b)) } })`
  assert.equal(findPrismaCalls(bad, 'x.ts').filter((c) => !c.args.includes('barbeariaId')).length, 1)
  assert.equal(findPrismaCalls(good, 'x.ts').filter((c) => !c.args.includes('barbeariaId')).length, 0)
  assert.equal(findPrismaCalls(nested, 'x.ts')[0].args.includes('barbeariaId'), true)
})

test('toda chamada Prisma sobre tabela de barbearia menciona barbeariaId', () => {
  const calls = SCAN_DIRS.flatMap(listFiles).flatMap((file) => findPrismaCalls(fs.readFileSync(path.join(ROOT, file), 'utf8'), file))
  assert.ok(calls.length > 40, `poucas chamadas encontradas (${calls.length}); o detector parou de funcionar?`)
  const offenders = calls
    .filter((call) => !call.args.includes('barbeariaId'))
    .filter((call) => !ALLOWED[`${call.file} ${call.model}.${call.op}`])
    .map((call) => `${call.file}:${call.line} ${call.model}.${call.op}`)
  assert.deepEqual(offenders, [], `chamadas sem barbeariaId (filtre pela barbearia ou justifique em ALLOWED):\n${offenders.join('\n')}`)
})

test('nenhuma exceção em ALLOWED está sobrando', () => {
  const calls = SCAN_DIRS.flatMap(listFiles).flatMap((file) => findPrismaCalls(fs.readFileSync(path.join(ROOT, file), 'utf8'), file))
  const used = new Set(calls.filter((c) => !c.args.includes('barbeariaId')).map((c) => `${c.file} ${c.model}.${c.op}`))
  assert.deepEqual(Object.keys(ALLOWED).filter((key) => !used.has(key)), [])
})

test('sem SQL cru ($queryRaw/$executeRaw) nas rotas e libs: escaparia desta checagem', () => {
  const raw = SCAN_DIRS.flatMap(listFiles).filter((file) => /\$(queryRaw|executeRaw)/.test(fs.readFileSync(path.join(ROOT, file), 'utf8')))
  assert.deepEqual(raw, [])
})
