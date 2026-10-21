// Suíte de isolamento entre barbearias, contra um servidor real.
//
// Preparo (banco LOCAL; a fixture e esta suíte recusam banco remoto):
//   1. npm run test:fixture
//   2. npm run build && TENANT_ROOT_DOMAIN=navalha.app npx next start -p 3130
//   3. TEST_PORT=3130 npm run test:isolation
//
// O Host é enviado explicitamente para 127.0.0.1 (america.navalha.app e teste-b.navalha.app não precisam
// existir no DNS). Os dados da barbearia B não podem mudar e nada pode ser criado em nenhuma barbearia.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { B_ID, FIXTURE_PASSWORD } from '../fixtures/constants'
import { assertLocalDatabase } from '../../scripts/local-db-guard'

assertLocalDatabase('test:isolation')

const port = Number(process.env.TEST_PORT ?? 3130)
const A = 'america.navalha.app'
const B = 'teste-b.navalha.app'
const GUESS = 'cmzzzzzzzzzzzzzzzzzzzzzzz'
const B_MARKERS = [B_ID, 'b-admin', 'b-barber', 'b-client', 'b-service', 'b-appt', 'b-category', 'b-tx', 'b-goal', 'b-product', 'b-alert',
  'B Despesa', 'B Categoria', 'B Cliente', 'B Servico', 'B Meta', 'B Produto', 'B Alerta', 'B Barbeiro']
const ROOT = path.resolve(__dirname, '..', '..')
const prisma = new PrismaClient()
let failures = 0
let checks = 0
const covered = new Set<string>()

const B_SNAPSHOT_SQL = `select md5(coalesce(string_agg(t, '|' order by t), '')) as h from (
  select row_to_json(x)::text t from "User" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Client" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Service" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Appointment" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "AppointmentService" x where "appointmentId" in (select id from "Appointment" where "barbeariaId"='${B_ID}')
  union all select row_to_json(x)::text from "Transaction" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Category" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Goal" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Product" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "FinanceAlert" x where "barbeariaId"='${B_ID}'
  union all select row_to_json(x)::text from "Barbearia" x where id='${B_ID}') s`
const COUNTS_SQL = `select string_agg(t||'='||n, ' ' order by t) as c from (
  select 'User' t, count(*) n from "User" union all select 'Client', count(*) from "Client"
  union all select 'Service', count(*) from "Service" union all select 'Appointment', count(*) from "Appointment"
  union all select 'Transaction', count(*) from "Transaction" union all select 'Category', count(*) from "Category"
  union all select 'Goal', count(*) from "Goal" union all select 'Product', count(*) from "Product"
  union all select 'FinanceAlert', count(*) from "FinanceAlert") x`
const one = async (query: string) => Object.values(((await prisma.$queryRawUnsafe(query)) as Record<string, unknown>[])[0])[0]
const scalar = async (query: string) => String(await one(query))

interface Res { status: number; text: string; json: any; token?: string }
function request(host: string, method: string, urlPath: string, opts: { body?: unknown; token?: string } = {}): Promise<Res> {
  return new Promise((resolve, reject) => {
    const payload = opts.body ? JSON.stringify(opts.body) : undefined
    const req = http.request({
      host: '127.0.0.1', port, path: urlPath, method,
      headers: {
        Host: host,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(opts.token ? { Cookie: `barberos_session=${opts.token}` } : {}),
      },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(data) } catch {}
        resolve({ status: res.statusCode ?? 0, text: data, json, token: /barberos_session=([^;]+)/.exec((res.headers['set-cookie'] ?? []).join(''))?.[1] })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}
function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' | ' + detail : ''}`)
}
const route = (method: string, template: string) => covered.add(`${method} ${template}`)
const leaks = (text: string) => B_MARKERS.filter((marker) => text.includes(marker))

async function main() {

  const bBefore = await scalar(B_SNAPSHOT_SQL)
  const countsBefore = await scalar(COUNTS_SQL)
  const login = async (h: string, email: string) => (await request(h, 'POST', '/api/auth/login', { body: { email, password: FIXTURE_PASSWORD } })).token
  const tA = await login(A, 'smoke.admin@local.dev')
  const tABarber = await login(A, 'smoke.barber@local.dev')
  const tB = await login(B, 'b.admin@local.dev')
  check('logins de teste (rode a fixture antes)', Boolean(tA && tABarber && tB))
  route('POST', '/api/auth/login')

  // Registros fixos da América criados pela fixture: a suíte não depende dos dados que o banco já tiver
  const aClient = 'smoke-client'
  const aService = 'smoke-service'
  const aAppt = 'smoke-appt'

  // 1. Listagens e agregações de A não contêm B
  const lists: [string, string, string][] = [
    ['GET', '/api/appointments', '/api/appointments'],
    ['GET', '/api/appointments', '/api/appointments?month=2026-12'],
    ['GET', '/api/clients', '/api/clients'],
    ['GET', '/api/clients', '/api/clients?minimal=true'],
    ['GET', '/api/dashboard', '/api/dashboard'],
    ['GET', '/api/finances', '/api/finances'],
    ['GET', '/api/finances/alerts', '/api/finances/alerts'],
    ['GET', '/api/finances/categories', '/api/finances/categories'],
    ['GET', '/api/finances/export', '/api/finances/export?period=12'],
    ['GET', '/api/finances/reports', '/api/finances/reports?period=12'],
    ['GET', '/api/finances/stats', '/api/finances/stats?months=12'],
    ['GET', '/api/goals', '/api/goals'],
    ['GET', '/api/products', '/api/products'],
    ['GET', '/api/services', '/api/services'],
    ['GET', '/api/users', '/api/users'],
    ['GET', '/api/auth/me', '/api/auth/me'],
  ]
  for (const [method, template, urlPath] of lists) {
    route(method, template)
    const r = await request(A, method, urlPath, { token: tA })
    check(`A ${urlPath}: 200 sem dados de B`, r.status === 200 && leaks(r.text).length === 0, `status=${r.status} vazou=${leaks(r.text).join(',')}`)
  }
  for (const urlPath of ['/api/appointments', '/api/clients', '/api/services']) {
    const r = await request(A, 'GET', urlPath, { token: tABarber })
    check(`barbeiro A ${urlPath}: sem dados de B`, r.status === 200 && leaks(r.text).length === 0, `status=${r.status}`)
  }
  const sumA = async (type: string) => Number(await scalar(`select coalesce(sum(amount),0) from "Transaction" where "barbeariaId"='barbearia-america' and type='${type}'`))
  const reports = (await request(A, 'GET', '/api/finances/reports?period=12', { token: tA })).json
  check('reports: despesas = soma de A no banco', Math.abs(reports.totals.expense - await sumA('EXPENSE')) < 0.001, `api=${reports.totals.expense}`)
  check('reports: receitas = soma de A no banco', Math.abs(reports.totals.income - await sumA('INCOME')) < 0.001, `api=${reports.totals.income}`)
  // Caixa da barbearia (card "Caixa da Barbearia"): todo o histórico de A, sem a despesa de B (777)
  const stats = (await request(A, 'GET', '/api/finances/stats?months=6', { token: tA })).json
  const balanceA = (await sumA('INCOME')) - (await sumA('EXPENSE'))
  check('stats: caixa = receitas - despesas de A no banco', typeof stats?.allTime?.balance === 'number' && Math.abs(stats.allTime.balance - balanceA) < 0.001, `api=${stats?.allTime?.balance} banco=${balanceA}`)
  const dash = (await request(A, 'GET', '/api/dashboard', { token: tA })).json
  const aClients = Number(await scalar(`select count(*) from "Client" where "barbeariaId"='barbearia-america' and "isActive"`))
  check('dashboard: total de clientes = clientes ativos de A', dash.totalClients === aClients, `api=${dash.totalClients} banco=${aClients}`)

  // 2. Rotas com [id]: id de B e id adivinhado dão o mesmo 404
  const byId: [string, string, string, unknown?][] = [
    ['PATCH', '/api/appointments/[id]', 'b-appt', { status: 'CANCELED' }],
    ['PATCH', '/api/clients/[id]', 'b-client', { name: 'invadido' }],
    ['DELETE', '/api/clients/[id]', 'b-client'],
    ['DELETE', '/api/finances/[id]', 'b-tx'],
    ['DELETE', '/api/goals/[id]', 'b-goal'],
    ['PATCH', '/api/products/[id]', 'b-product', { name: 'invadido', price: 1, stock: 1, active: true }],
    ['DELETE', '/api/products/[id]', 'b-product'],
    ['PATCH', '/api/services/[id]', 'b-service', { name: 'invadido' }],
    ['DELETE', '/api/services/[id]', 'b-service'],
    ['POST', '/api/services/[id]/image', 'b-service'],
    ['DELETE', '/api/services/[id]/image', 'b-service'],
    ['PATCH', '/api/users/[id]', 'b-admin', { active: false }],
    ['DELETE', '/api/users/[id]', 'b-barber'],
    ['POST', '/api/users/[id]/avatar', 'b-barber'],
    ['DELETE', '/api/users/[id]/avatar', 'b-barber'],
  ]
  for (const [method, template, bId, body] of byId) {
    route(method, template)
    const rB = await request(A, method, template.replace('[id]', bId), { token: tA, body })
    const rG = await request(A, method, template.replace('[id]', GUESS), { token: tA, body })
    check(`${method} ${template} com id de B: 404`, rB.status === 404, `status=${rB.status} ${rB.text.slice(0, 80)}`)
    check(`${method} ${template}: id de B e id adivinhado com a mesma resposta`, rB.status === rG.status && rB.text === rG.text)
  }
  const barberB = await request(A, 'PATCH', '/api/appointments/b-appt', { token: tABarber, body: { status: 'CONFIRMED' } })
  check('barbeiro A no agendamento de B: 404 (nunca 403)', barberB.status === 404, `status=${barberB.status}`)
  route('DELETE', '/api/appointments/[id]')
  const delB = await request(A, 'DELETE', '/api/appointments/b-appt', { token: tA })
  const delA = await request(A, 'DELETE', `/api/appointments/${aAppt}`, { token: tA })
  check('DELETE agendamento: mesma resposta para id de B e de A', delB.status === 409 && delB.text === delA.text)
  route('POST', '/api/finances/alerts')
  check('markRead do alerta de B: 404', (await request(A, 'POST', '/api/finances/alerts', { token: tA, body: { action: 'markRead', id: 'b-alert' } })).status === 404)
  await request(A, 'POST', '/api/finances/alerts', { token: tA, body: { action: 'markAllRead' } })
  check('markAllRead em A não marca alerta de B', await scalar(`select read from "FinanceAlert" where id='b-alert'`) === 'false')

  // 3. Referências cruzadas no corpo
  const refs: [string, string, string, unknown, string][] = [
    ['POST', '/api/appointments', '/api/appointments', { clientId: 'b-client', serviceIds: [aService], date: '2026-12-03T10:00' }, 'cliente de B'],
    ['POST', '/api/appointments', '/api/appointments', { clientId: aClient, serviceIds: ['b-service'], date: '2026-12-03T10:00' }, 'serviço de B'],
    ['POST', '/api/appointments', '/api/appointments', { clientId: aClient, serviceIds: [aService], barberId: 'b-barber', date: '2026-12-03T10:00' }, 'barbeiro de B'],
    ['PATCH', '/api/appointments/[id]', `/api/appointments/${aAppt}`, { clientId: 'b-client' }, 'trocar para cliente de B'],
    ['PATCH', '/api/appointments/[id]', `/api/appointments/${aAppt}`, { serviceIds: ['b-service'] }, 'trocar para serviço de B'],
    ['PATCH', '/api/appointments/[id]', `/api/appointments/${aAppt}`, { barberId: 'b-barber' }, 'trocar para barbeiro de B'],
    ['POST', '/api/finances', '/api/finances', { type: 'EXPENSE', amount: 1, description: 'x', categoryId: 'b-category', date: '2026-10-18' }, 'categoria de B'],
  ]
  for (const [method, template, urlPath, body, label] of refs) {
    route(method, template)
    const r = await request(A, method, urlPath, { token: tA, body })
    check(`${method} ${template} com ${label}: 404`, r.status === 404, `status=${r.status} ${r.text.slice(0, 100)}`)
  }

  // 4. Reserva pública
  route('POST', '/api/book'); route('GET', '/api/book'); route('GET', '/api/book/availability')
  check('reserva pública A com serviço de B: 404', (await request(A, 'POST', '/api/book', { body: { name: 'Teste', phone: '69981234567', serviceIds: ['b-service'], date: '2026-12-03', time: '10:00' } })).status === 404)
  check('reserva pública A com barbeiro de B: 404', (await request(A, 'POST', '/api/book', { body: { name: 'Teste', phone: '69981234567', serviceIds: [aService], barberId: 'b-barber', date: '2026-12-03', time: '10:00' } })).status === 404)
  const pubA = (await request(A, 'GET', '/api/book')).json
  check('GET /api/book na A: sem barbeiro ou serviço de B', !pubA.barbers.some((b: any) => b.id.startsWith('b-')) && !pubA.services.some((s: any) => s.id.startsWith('b-')))
  const pubB = (await request(B, 'GET', '/api/book')).json
  check('GET /api/book na B: só itens de B', pubB.barbers.length > 0 && pubB.barbers.every((b: any) => b.id.startsWith('b-')) && pubB.services.every((s: any) => s.id.startsWith('b-')))
  check('disponibilidade da A ignora agendamento de B no mesmo dia', !(await request(A, 'GET', '/api/book/availability?date=2026-12-02')).text.includes('b-barber'))
  check('disponibilidade da B mostra o agendamento de B', (await request(B, 'GET', '/api/book/availability?date=2026-12-02')).text.includes('b-barber'))
  check('disponibilidade da A com serviço de B: 404', (await request(A, 'GET', '/api/book/availability?date=2026-12-02&serviceIds=b-service')).status === 404)

  // 5. WhatsApp: instância global, só a barbearia padrão
  for (const [method, template] of [['GET', '/api/whatsapp/connect'], ['GET', '/api/whatsapp/instance'], ['POST', '/api/whatsapp/instance']]) {
    route(method, template)
    const r = await request(B, method, template, { token: tB, body: method === 'POST' ? {} : undefined })
    check(`${method} ${template} com admin de B: 404`, r.status === 404, `status=${r.status}`)
  }

  // 6. Token no host errado: 401 em todas as rotas autenticadas
  const crossHost: [string, string][] = [
    ['GET', '/api/appointments'], ['POST', '/api/appointments'], ['PATCH', '/api/appointments/[id]'], ['DELETE', '/api/appointments/[id]'],
    ['GET', '/api/clients'], ['POST', '/api/clients'], ['PATCH', '/api/clients/[id]'], ['DELETE', '/api/clients/[id]'],
    ['GET', '/api/dashboard'], ['GET', '/api/finances'], ['POST', '/api/finances'], ['DELETE', '/api/finances/[id]'],
    ['GET', '/api/finances/alerts'], ['POST', '/api/finances/alerts'], ['GET', '/api/finances/categories'], ['GET', '/api/finances/export'],
    ['GET', '/api/finances/reports'], ['GET', '/api/finances/stats'], ['GET', '/api/goals'], ['POST', '/api/goals'], ['DELETE', '/api/goals/[id]'],
    ['GET', '/api/products'], ['POST', '/api/products'], ['PATCH', '/api/products/[id]'], ['DELETE', '/api/products/[id]'],
    ['GET', '/api/services'], ['POST', '/api/services'], ['PATCH', '/api/services/[id]'], ['DELETE', '/api/services/[id]'],
    ['POST', '/api/services/[id]/image'], ['DELETE', '/api/services/[id]/image'],
    ['GET', '/api/users'], ['POST', '/api/users'], ['PATCH', '/api/users/[id]'], ['DELETE', '/api/users/[id]'],
    ['POST', '/api/users/[id]/avatar'], ['DELETE', '/api/users/[id]/avatar'],
    ['GET', '/api/whatsapp/connect'], ['GET', '/api/whatsapp/instance'], ['POST', '/api/whatsapp/instance'],
  ]
  for (const [method, template] of crossHost) {
    route(method, template)
    const body = method === 'GET' || method === 'DELETE' ? undefined : {}
    const aOnB = await request(B, method, template.replace('[id]', 'b-appt'), { token: tA, body })
    const bOnA = await request(A, method, template.replace('[id]', aAppt), { token: tB, body })
    check(`${method} ${template}: token A no host B e token B no host A = 401`, aOnB.status === 401 && bOnA.status === 401, `A@B=${aOnB.status} B@A=${bOnA.status}`)
  }
  check('/api/auth/me: token A no host B = 401', (await request(B, 'GET', '/api/auth/me', { token: tA })).status === 401)
  route('POST', '/api/auth/logout')
  check('/api/auth/logout responde em A', (await request(A, 'POST', '/api/auth/logout', { token: tA })).status === 200)

  // 7. Cobertura: toda rota+método do código tem caso
  const apiDir = path.join(ROOT, 'app', 'api')
  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'route.ts') {
        const template = '/api/' + path.relative(apiDir, dir).split(path.sep).join('/')
        for (const m of fs.readFileSync(full, 'utf8').matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)/g)) found.push(`${m[1]} ${template}`)
      }
    }
  }
  walk(apiDir)
  const missing = found.filter((key) => !covered.has(key))
  check(`cobertura: ${found.length} rota+método no código, todos com caso`, missing.length === 0, `sem caso: ${missing.join(', ')}`)

  // 8. Nada mudou
  check('dados de B idênticos antes e depois (hash de todas as linhas)', await scalar(B_SNAPSHOT_SQL) === bBefore)
  const countsAfter = await scalar(COUNTS_SQL)
  check('nenhuma linha criada ou apagada', countsAfter === countsBefore, `antes=${countsBefore} depois=${countsAfter}`)

  console.log(`${checks} verificações, ${covered.size} rota+método cobertos`)
  console.log(failures ? `RESULTADO: ${failures} falha(s)` : 'RESULTADO: isolamento comprovado em todas as rotas')
  if (failures) process.exitCode = 1
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
