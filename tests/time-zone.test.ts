import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getZonedParts,
  parseZonedDate,
  startOfZonedDay,
  startOfZonedMonth,
  startOfZonedWeek,
  zonedDayKey,
  zonedMonthKey,
  zonedMonthRange,
} from '../lib/time-zone'
import { getAppointmentDayRange, parseAppointmentDate, validateAppointmentSchedule } from '../lib/appointment-rules'

// Rode com TZ diferentes (UTC, America/Sao_Paulo, Asia/Kathmandu): o resultado não pode depender da máquina.
const PV = 'America/Porto_Velho' // UTC-4, sem horário de verão
const SP = 'America/Sao_Paulo' // UTC-3
const iso = (date: Date) => date.toISOString()

// 31/10/2026 23:30 em Porto Velho = 01/11/2026 03:30 UTC
const edge = new Date('2026-11-01T03:30:00Z')

test('borda 23:30 em Porto Velho: dia e mês do relógio da barbearia', () => {
  assert.deepEqual(getZonedParts(edge, PV), { year: 2026, month: 10, day: 31, hour: 23, minute: 30 })
  assert.equal(zonedDayKey(edge, PV), '2026-10-31')
  assert.equal(zonedMonthKey(edge, PV), '2026-10')
  assert.equal(edge.toISOString().slice(0, 7), '2026-11') // o agrupamento antigo (UTC) erraria o mês
})

test('borda 23:30: inícios de dia, semana e mês', () => {
  assert.equal(iso(startOfZonedDay(edge, PV)), '2026-10-31T04:00:00.000Z')
  assert.equal(iso(startOfZonedDay(edge, PV, 1)), '2026-11-01T04:00:00.000Z')
  assert.equal(iso(startOfZonedDay(edge, PV, -6)), '2026-10-25T04:00:00.000Z')
  // 31/10/2026 é sábado: a semana começa na segunda 26/10
  assert.equal(iso(startOfZonedWeek(edge, PV)), '2026-10-26T04:00:00.000Z')
  // domingo 01/11 23:30 ainda é a semana de 26/10
  assert.equal(iso(startOfZonedWeek(new Date('2026-11-02T03:30:00Z'), PV)), '2026-10-26T04:00:00.000Z')
  assert.equal(iso(startOfZonedMonth(edge, PV)), '2026-10-01T04:00:00.000Z')
  assert.equal(iso(startOfZonedMonth(edge, PV, 1)), '2026-11-01T04:00:00.000Z')
  assert.equal(iso(startOfZonedMonth(edge, PV, -10)), '2025-12-01T04:00:00.000Z')
})

test('borda 23:30: intervalo de mês inclui 31/10 23:30 em outubro, não em novembro', () => {
  const oct = zonedMonthRange(2026, 10, PV)
  const nov = zonedMonthRange(2026, 11, PV)
  assert.ok(edge >= oct.start && edge < oct.end)
  assert.ok(!(edge >= nov.start && edge < nov.end))
  assert.equal(iso(zonedMonthRange(2026, 12, PV).end), '2027-01-01T04:00:00.000Z')
})

test('data sem hora (formulário) vira meia-noite no fuso, não em UTC', () => {
  assert.equal(iso(parseZonedDate('2026-11-01', PV)), '2026-11-01T04:00:00.000Z')
  assert.equal(zonedMonthKey(parseZonedDate('2026-11-01', PV), PV), '2026-11')
  assert.equal(zonedMonthKey(new Date('2026-11-01'), PV), '2026-10') // o new Date antigo cairia em outubro
  assert.equal(iso(parseZonedDate('2026-11-01T10:00:00Z', PV)), '2026-11-01T10:00:00.000Z')
})

test('mesmo horário de parede em barbearias de fusos diferentes', () => {
  assert.equal(iso(parseAppointmentDate('2026-12-02T10:00', PV)), '2026-12-02T14:00:00.000Z')
  assert.equal(iso(parseAppointmentDate('2026-12-02T10:00', SP)), '2026-12-02T13:00:00.000Z')
  const day = getAppointmentDayRange('2026-12-02', PV)
  assert.equal(iso(day.start), '2026-12-02T04:00:00.000Z')
  assert.equal(iso(day.end), '2026-12-03T04:00:00.000Z')
})

test('dia com horário de verão tem 23h (fuso com DST)', () => {
  const ny = getAppointmentDayRange('2026-03-08', 'America/New_York')
  assert.equal(ny.end.getTime() - ny.start.getTime(), 23 * 60 * 60 * 1000)
})

test('regras de agenda não dependem do fuso da máquina (minuto e dia da semana no fuso da barbearia)', () => {
  // 10:00 em Porto Velho (quarta-feira) é horário válido em qualquer TZ da máquina; com o antigo
  // date.getMinutes() e a máquina em Asia/Kathmandu (+05:45) o minuto lido seria 45 e o horário recusado
  assert.doesNotThrow(() => validateAppointmentSchedule(parseAppointmentDate('2026-12-02T10:00', PV), 30, PV, false))
  assert.throws(() => validateAppointmentSchedule(parseAppointmentDate('2026-12-02T10:15', PV), 30, PV, false), /intervalos de 30 minutos/)
  assert.throws(() => validateAppointmentSchedule(parseAppointmentDate('2026-12-06T10:00', PV), 30, PV, false), /domingos/)
  assert.throws(() => validateAppointmentSchedule(parseAppointmentDate('2026-12-02T19:45', PV), 30, PV, false), /entre 08:00 e 19:30/)
})
