// Fixture dos testes de isolamento: barbearia B (teste-b, America/Sao_Paulo) com um registro de cada tabela,
// ids fixos "b-*", e registros de teste da América (smoke-*: admin, barbeiro, cliente, serviço, agendamento).
// Senha dos usuários: Smoke-Teste-2026.
// Recria do zero a cada execução (apaga B e os usuários smoke antes). SÓ roda em banco local.
//
// Uso: npm run test:fixture
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_BARBEARIA_ID } from '../../lib/tenant-host'
import { seedDefaultCategories } from '../../prisma/seed-data'
import { assertLocalDatabase } from '../../scripts/local-db-guard'
import { B_ID, FIXTURE_PASSWORD } from './constants'

// Senhas conhecidas e exclusão de dados: nunca em banco remoto
assertLocalDatabase('test:fixture')
const prisma = new PrismaClient()

async function reset() {
  const bAppointments = (await prisma.appointment.findMany({ where: { barbeariaId: B_ID }, select: { id: true } })).map((a) => a.id)
  await prisma.transaction.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.appointmentService.deleteMany({ where: { appointmentId: { in: bAppointments } } })
  await prisma.appointment.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.client.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.service.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.category.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.goal.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.product.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.financeAlert.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.user.deleteMany({ where: { barbeariaId: B_ID } })
  await prisma.barbearia.deleteMany({ where: { id: B_ID } })
  // Usuários de teste da América: só se não tiverem agendamentos (testes que criam dados limpam os seus)
  await prisma.user.deleteMany({ where: { id: { in: ['smoke-admin', 'smoke-barber'] }, appointments: { none: {} } } })
}

async function main() {
  await reset()
  const password = await bcrypt.hash(FIXTURE_PASSWORD, 10)
  const now = new Date()

  await prisma.barbearia.create({
    data: { id: B_ID, name: 'Barbearia Teste B', subdomain: 'teste-b', timezone: 'America/Sao_Paulo' },
  })
  await seedDefaultCategories(prisma, B_ID)
  await prisma.user.createMany({
    data: [
      { id: 'b-admin', barbeariaId: B_ID, name: 'B Admin', email: 'b.admin@local.dev', password, role: 'ADMIN' },
      { id: 'b-barber', barbeariaId: B_ID, name: 'B Barbeiro', email: 'b.barber@local.dev', password, role: 'BARBER', phone: '5511999990000' },
    ],
  })
  await prisma.user.createMany({
    data: [
      { id: 'smoke-admin', barbeariaId: DEFAULT_BARBEARIA_ID, name: 'SMOKE Admin A', email: 'smoke.admin@local.dev', password, role: 'ADMIN' },
      { id: 'smoke-barber', barbeariaId: DEFAULT_BARBEARIA_ID, name: 'SMOKE Barbeiro A', email: 'smoke.barber@local.dev', password, role: 'BARBER' },
    ],
    skipDuplicates: true,
  })
  // Registros fixos da América usados pelas suítes (cliente, serviço, agendamento). Criados só se faltarem: num banco
  // novo (CI) a América não tem nada; num banco local com dados, não são recriados nem alterados.
  await prisma.client.upsert({
    where: { id: 'smoke-client' }, update: {},
    create: { id: 'smoke-client', barbeariaId: DEFAULT_BARBEARIA_ID, name: 'SMOKE Cliente A', phone: '5569900000001' },
  })
  await prisma.service.upsert({
    where: { id: 'smoke-service' }, update: {},
    create: { id: 'smoke-service', barbeariaId: DEFAULT_BARBEARIA_ID, name: 'SMOKE Servico A', price: 40, durationMins: 30 },
  })
  if (!(await prisma.appointment.findUnique({ where: { id: 'smoke-appt' }, select: { id: true } }))) {
    await prisma.appointment.create({
      data: {
        id: 'smoke-appt', barbeariaId: DEFAULT_BARBEARIA_ID, clientId: 'smoke-client', serviceId: 'smoke-service', barberId: 'smoke-barber',
        date: new Date('2026-12-03T14:00:00Z'), status: 'CONFIRMED',
        appointmentServices: { create: [{ serviceId: 'smoke-service', price: 40, durationMins: 30 }] },
      },
    })
  }
  await prisma.client.create({ data: { id: 'b-client', barbeariaId: B_ID, name: 'B Cliente', phone: '5511988887777' } })
  await prisma.service.create({ data: { id: 'b-service', barbeariaId: B_ID, name: 'B Servico', price: 99, durationMins: 30 } })
  await prisma.appointment.create({
    data: {
      id: 'b-appt', barbeariaId: B_ID, clientId: 'b-client', serviceId: 'b-service', barberId: 'b-barber',
      date: new Date('2026-12-02T14:00:00Z'), status: 'CONFIRMED',
      appointmentServices: { create: [{ serviceId: 'b-service', price: 99, durationMins: 30 }] },
    },
  })
  await prisma.category.create({ data: { id: 'b-category', barbeariaId: B_ID, name: 'B Categoria', type: 'EXPENSE' } })
  await prisma.transaction.create({
    data: { id: 'b-tx', barbeariaId: B_ID, type: 'EXPENSE', amount: 777, description: 'B Despesa', categoryId: 'b-category', date: now },
  })
  await prisma.goal.create({
    data: {
      id: 'b-goal', barbeariaId: B_ID, title: 'B Meta', type: 'REVENUE', targetAmount: 5000, period: 'monthly',
      startDate: new Date(now.getTime() - 24 * 3600_000), endDate: new Date(now.getTime() + 30 * 24 * 3600_000),
    },
  })
  await prisma.product.create({ data: { id: 'b-product', barbeariaId: B_ID, name: 'B Produto', price: 10, stock: 5 } })
  await prisma.financeAlert.create({
    data: { id: 'b-alert', barbeariaId: B_ID, type: 'HIGH_SPENDING', message: 'B Alerta', severity: 'DANGER' },
  })
  console.log('[fixture] Barbearia B e usuários de teste prontos.')
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
