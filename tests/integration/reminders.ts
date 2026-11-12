// Robô de lembretes (scripts/cron.ts) contra o banco LOCAL e uma Evolution falsa que só registra o que recebe.
// Prova: lembra só o agendamento certo (barbearia padrão, confirmado, não excluído, 30-70 min à frente), avisa
// cliente e barbeiro com telefone normalizado, marca o envio, não marca quando a Evolution falha, e o log não traz
// nome nem telefone do cliente.
//
// Preparo: npm run test:fixture   Uso: npm run test:reminders
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { assertLocalDatabase } from '../../scripts/local-db-guard'
import { B_ID } from '../fixtures/constants'

assertLocalDatabase('test:reminders')
const prisma = new PrismaClient()
const A_ID = 'barbearia-america'
let failures = 0
let checks = 0
function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' | ' + detail : ''}`)
}

// Evolution falsa
let evolutionStatus = 200
const received: { number: string; text: string }[] = []
const evolution = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => {
    try { received.push(JSON.parse(body)) } catch {}
    res.writeHead(evolutionStatus, { 'Content-Type': 'application/json' })
    res.end('{}')
  })
})

const CLIENT_PHONE_RAW = '(69) 98888-7777'
const BARBER_PHONE_RAW = '69 97777-6666'
const IDS = ['rem-ok', 'rem-cedo', 'rem-excluido', 'rem-outra-barbearia']

async function cleanup() {
  await prisma.appointment.deleteMany({ where: { id: { in: IDS } } })
}

// Um ciclo do robô: sobe o processo, espera a primeira volta terminar e encerra.
function runCronOnce(port: number): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join('node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/cron.ts'], {
      env: { ...process.env, NEXT_PUBLIC_EVO_URL: `http://127.0.0.1:${port}`, EVO_API_KEY: 'teste', ENABLE_WHATSAPP_SANDBOX: 'false', N8N_WEBHOOK_URL: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let log = ''
    let done = false
    const finish = () => { if (done) return; done = true; child.kill(); resolve(log) }
    const onData = (d: Buffer) => { log += d; if (log.includes('Ciclo concluído')) finish() }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    // A primeira volta roda ao iniciar; o robô avisa no log quando termina. Teto de 90 s.
    setTimeout(finish, 90_000)
  })
}

async function main() {
  await new Promise<void>((r) => evolution.listen(0, '127.0.0.1', r))
  const port = (evolution.address() as { port: number }).port
  await cleanup()

  const smokeClient = await prisma.client.findUnique({ where: { id: 'smoke-client' } })
  const smokeBarber = await prisma.user.findUnique({ where: { id: 'smoke-barber' } })
  if (!smokeClient || !smokeBarber) throw new Error('Rode a fixture antes (npm run test:fixture).')
  const originalClientPhone = smokeClient.phone
  const originalBarberPhone = smokeBarber.phone
  await prisma.client.update({ where: { id: 'smoke-client' }, data: { phone: CLIENT_PHONE_RAW } })
  await prisma.user.update({ where: { id: 'smoke-barber' }, data: { phone: BARBER_PHONE_RAW } })

  const inMinutes = (m: number) => new Date(Date.now() + m * 60_000)
  const base = { clientId: 'smoke-client', serviceId: 'smoke-service', barberId: 'smoke-barber', status: 'CONFIRMED' as const }
  try {
    await prisma.appointment.create({ data: { ...base, id: 'rem-ok', barbeariaId: A_ID, date: inMinutes(45) } })
    await prisma.appointment.create({ data: { ...base, id: 'rem-cedo', barbeariaId: A_ID, date: inMinutes(10) } })
    await prisma.appointment.create({ data: { ...base, id: 'rem-excluido', barbeariaId: A_ID, date: inMinutes(50), deletedAt: new Date(), deletedById: 'smoke-admin', deletionReason: 'teste' } })
    await prisma.appointment.create({
      data: { id: 'rem-outra-barbearia', barbeariaId: B_ID, clientId: 'b-client', serviceId: 'b-service', barberId: 'b-barber', status: 'CONFIRMED', date: inMinutes(45) },
    })

    // 1. Evolution respondendo
    const log = await runCronOnce(port)
    const flag = async (id: string) => (await prisma.appointment.findUnique({ where: { id }, select: { reminderSent: true } }))?.reminderSent
    check('duas mensagens (cliente e barbeiro do agendamento certo)', received.length === 2, `recebidas=${received.length}`)
    check('cliente com telefone normalizado', received[0]?.number === '5569988887777', received[0]?.number)
    check('barbeiro com telefone normalizado', received[1]?.number === '5569977776666', received[1]?.number)
    check('texto do lembrete ao cliente', /Lembrete de Agendamento/.test(received[0]?.text ?? ''))
    check('agendamento certo marcado como lembrado', (await flag('rem-ok')) === true)
    check('a 10 minutos: fora da janela, não lembrado', (await flag('rem-cedo')) === false)
    check('excluído: não lembrado', (await flag('rem-excluido')) === false)
    check('outra barbearia: não lembrado (o WhatsApp é da barbearia padrão)', (await flag('rem-outra-barbearia')) === false)
    check('log sem nome nem telefone do cliente', !log.includes('98888') && !log.includes('SMOKE Cliente'), log.split('\n').filter(Boolean).slice(-2).join(' / '))

    // 2. Já lembrado: a próxima volta não manda de novo
    received.length = 0
    await runCronOnce(port)
    check('não repete o lembrete já enviado', received.length === 0, `recebidas=${received.length}`)

    // 3. Evolution falhando: não marca, para tentar de novo
    await prisma.appointment.update({ where: { id: 'rem-ok' }, data: { reminderSent: false } })
    evolutionStatus = 500
    received.length = 0
    await runCronOnce(port)
    check('Evolution fora: tentou enviar', received.length >= 1, `recebidas=${received.length}`)
    check('Evolution fora: não marca como lembrado (tenta de novo depois)', (await flag('rem-ok')) === false)
  } finally {
    await cleanup()
    await prisma.client.update({ where: { id: 'smoke-client' }, data: { phone: originalClientPhone } })
    await prisma.user.update({ where: { id: 'smoke-barber' }, data: { phone: originalBarberPhone } })
    evolution.close()
  }
}

main()
  .catch((error) => { failures += 1; console.error(error) })
  .finally(async () => {
    await prisma.$disconnect()
    console.log(`${checks} verificações`)
    console.log(failures ? `RESULTADO: ${failures} falha(s)` : 'RESULTADO: lembretes comprovados')
    process.exit(failures ? 1 : 0)
  })
