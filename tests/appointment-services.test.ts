import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAppointmentServiceSummary } from '../lib/appointment-services'

// As mensagens do WhatsApp põem os nomes em negrito (*Corte*). Com espaço nas pontas ("*Corte *") o WhatsApp
// não aplica o negrito e mostra os asteriscos: aconteceu com um serviço salvo como "Cortes ".

test('nomes dos serviços saem sem espaço nas pontas', () => {
  const summary = getAppointmentServiceSummary({
    appointmentServices: [
      { service: { name: 'Cortes ' }, price: 30, durationMins: 30 },
      { service: { name: '  Barba' }, price: 20, durationMins: 15 },
    ],
  })
  assert.deepEqual(summary.names, ['Cortes', 'Barba'])
  assert.equal(summary.namesJoined, 'Cortes, Barba')
  assert.equal(`*${summary.namesJoined}*`, '*Cortes, Barba*')
  assert.equal(summary.totalPrice, 50)
  assert.equal(summary.totalDurationMins, 45)
})

test('agendamento antigo (só service, sem a tabela de serviços) também sai sem espaço', () => {
  const summary = getAppointmentServiceSummary({ service: { name: ' Corte ', price: 30, durationMins: 30 }, appointmentServices: [] })
  assert.deepEqual(summary.names, ['Corte'])
  assert.equal(summary.namesJoined, 'Corte')
})

test('nome só de espaços é descartado', () => {
  const summary = getAppointmentServiceSummary({
    appointmentServices: [
      { service: { name: '   ' }, price: 10, durationMins: 10 },
      { service: { name: 'Corte' }, price: 30, durationMins: 30 },
    ],
  })
  assert.deepEqual(summary.names, ['Corte'])
})
