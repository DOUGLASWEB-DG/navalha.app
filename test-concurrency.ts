import crypto from 'node:crypto'

async function runTest() {
  const url = 'http://localhost:3000/api/book'

  // Generate a random phone number to avoid hitting the Phase 2 duplication error on the client creation
  // and purely test the concurrency of the appointment creation.
  const phone = '69' + Math.floor(100000000 + Math.random() * 900000000).toString()

  const payload = {
    name: 'Teste Concorrente',
    phone,
    serviceId: 'cm11w70a90000uv90w9u21a1b', // We'll need a real serviceId and barberId
    barberId: 'any',
    date: '2026-12-01',
    time: '19:00',
    notes: 'Teste de carga'
  }

  // Ensure we have a barber and a service
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  const barber = await prisma.user.upsert({
    where: { email: 'barber@test.com' },
    update: { role: 'BARBER' },
    create: { email: 'barber@test.com', name: 'Barber Test', password: '123', role: 'BARBER' }
  })
  
  const service = await prisma.service.upsert({
    where: { id: 'test_service_123' },
    update: { active: true },
    create: { id: 'test_service_123', name: 'Test Service', price: 50, durationMins: 30, active: true, description: 'Test' }
  })
  
  payload.serviceId = service.id
  payload.barberId = barber.id
  
  // Clean up any existing appointments at this time for this barber to ensure a fresh test
  await prisma.appointment.deleteMany({
    where: { 
      barberId: barber.id,
      date: new Date('2026-12-01T23:00:00Z') // assuming GMT-4 -> 19:00 local is 23:00 UTC
    }
  })

  console.log(`Disparando 10 requisições simultâneas para o serviço ${service.name} com barbeiro ${barber.name}...`)

  const requests = Array.from({ length: 10 }).map(() => {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async r => ({ status: r.status, body: await r.json() }))
  })

  const results = await Promise.all(requests)
  
  const status201 = results.filter(r => r.status === 201).length
  const status409 = results.filter(r => r.status === 409).length
  const status500 = results.filter(r => r.status === 500).length
  const others = results.filter(r => r.status !== 201 && r.status !== 409 && r.status !== 500).length
  
  console.log(`\nResultados:`)
  console.log(`201 (Sucesso): ${status201}`)
  console.log(`409 (Conflito): ${status409}`)
  console.log(`500 (Erro Interno): ${status500}`)
  if (others > 0) console.log(`Outros status: ${others}`)
  
  const finalAppointments = await prisma.appointment.count({
    where: {
      barberId: barber.id,
      date: new Date('2026-12-01T23:00:00Z')
    }
  })
  
  console.log(`\nBanco de Dados:`)
  console.log(`Agendamentos gravados no horário: ${finalAppointments}`)
  
  if (status201 === 1 && status409 === 9 && finalAppointments === 1) {
    console.log('\nTESTE PASSOU! A concorrência foi bloqueada corretamente.')
  } else {
    console.log('\nTESTE FALHOU! O bloqueio falhou.')
    console.log(results)
  }
}

runTest().catch(console.error)
