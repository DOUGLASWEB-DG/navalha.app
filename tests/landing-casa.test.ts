import { test } from 'node:test'
import assert from 'node:assert/strict'
import { landingDaCasaRoute } from '../lib/landing-casa'

test('América: a raiz mostra a página própria da casa', () => {
  assert.deepEqual(landingDaCasaRoute('america', '/'), { action: 'rewrite', to: '/america' })
})

test('América: as outras rotas ficam como estão (login, agendamento, painel, API)', () => {
  for (const path of ['/login', '/book', '/dashboard', '/dashboard/finances', '/api/auth/login', '/api/book', '/america', '/produto']) {
    assert.deepEqual(landingDaCasaRoute('america', path), { action: 'next' }, path)
  }
})

test('demo e qualquer outra barbearia: a raiz não muda', () => {
  for (const sub of ['demo', 'vitorbarber69', 'barbearia-b', 'America', 'americana', 'america2']) {
    assert.deepEqual(landingDaCasaRoute(sub, '/'), { action: 'next' }, sub)
  }
})

test('demo e as outras barbearias: /america não existe (404)', () => {
  for (const sub of ['demo', 'vitorbarber69', 'barbearia-b', 'America']) {
    for (const path of ['/america', '/america/', '/america/x']) {
      assert.deepEqual(landingDaCasaRoute(sub, path), { action: 'notFound' }, `${sub} ${path}`)
    }
  }
})

test('um caminho que só começa parecido com /america não é a página da casa', () => {
  for (const sub of ['demo', 'america']) {
    for (const path of ['/americana', '/america-x', '/americas']) {
      assert.deepEqual(landingDaCasaRoute(sub, path), { action: 'next' }, `${sub} ${path}`)
    }
  }
})
