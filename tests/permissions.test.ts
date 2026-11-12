import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePermissions, readPermissionOverrides } from '../lib/permissions'
test('barbeiro mantém o comportamento anterior quando não há configuração', () => {
  assert.equal(resolvePermissions('BARBER', null, null)['appointments.create'], true)
})
test('padrão do grupo permite revogar ações sem transformar o barbeiro em administrador', () => {
  assert.equal(resolvePermissions('BARBER', { 'appointments.edit': false }, {})['appointments.edit'], false)
})
test('exceções individuais prevalecem sobre o grupo, inclusive negações explícitas', () => {
  assert.equal(resolvePermissions('BARBER', { 'appointments.create': false }, { 'appointments.create': true })['appointments.create'], true)
  assert.equal(resolvePermissions('BARBER', { 'appointments.create': true }, { 'appointments.create': false })['appointments.create'], false)
})
test('administrador mantém acesso; perfil desconhecido falha fechado', () => {
  assert.equal(resolvePermissions('ADMIN', { 'appointments.create': false }, { 'appointments.create': false })['appointments.create'], true)
  assert.equal(resolvePermissions('OTHER', {}, {})['appointments.create'], false)
})
test('leitura ignora chaves e tipos não reconhecidos, sem permitir promoção de papel', () => {
  assert.deepEqual(readPermissionOverrides({ role: 'ADMIN', 'appointments.create': 'true', 'appointments.edit': false }), { 'appointments.edit': false })
  assert.deepEqual(readPermissionOverrides([]), {})
})
