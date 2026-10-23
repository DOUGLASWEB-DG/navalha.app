import { test } from 'node:test'
import assert from 'node:assert/strict'
import { demoLandingRoute } from '../lib/demo-landing'

test('demo: a raiz mostra a página do produto', () => {
  assert.deepEqual(demoLandingRoute('demo', '/'), { action: 'rewrite', to: '/produto' })
})

test('demo: as outras rotas ficam como estão', () => {
  for (const path of ['/login', '/book', '/dashboard', '/dashboard/finances', '/api/auth/login', '/produto']) {
    assert.deepEqual(demoLandingRoute('demo', path), { action: 'next' }, path)
  }
})

test('América e qualquer outra barbearia: a raiz não muda', () => {
  for (const sub of ['america', 'barbearia-b', 'demo2', 'Demo', 'demos']) {
    assert.deepEqual(demoLandingRoute(sub, '/'), { action: 'next' }, sub)
  }
})

test('América e outras barbearias: /produto não existe (404)', () => {
  for (const sub of ['america', 'barbearia-b', 'demo2']) {
    for (const path of ['/produto', '/produto/', '/produto/x']) {
      assert.deepEqual(demoLandingRoute(sub, path), { action: 'notFound' }, `${sub} ${path}`)
    }
  }
})

test('América: rotas normais passam intactas', () => {
  for (const path of ['/', '/login', '/book', '/dashboard', '/dashboard/appointments', '/api/book', '/produtos']) {
    assert.deepEqual(demoLandingRoute('america', path), { action: 'next' }, path)
  }
})
