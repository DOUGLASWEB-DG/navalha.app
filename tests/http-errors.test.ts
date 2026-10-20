import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest, errorMessage, friendlyMessage, HttpError, isSessionExpired } from '../lib/http-errors'

const realFetch = globalThis.fetch
function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = (async (url: string, init?: RequestInit) => handler(url, init)) as typeof fetch
}
function restoreFetch() {
  globalThis.fetch = realFetch
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('mensagem por status: o usuário sempre recebe orientação, nunca "Erro" solto', () => {
  assert.match(friendlyMessage(401), /sessão expirou/i)
  assert.match(friendlyMessage(403), /permissão/i)
  assert.match(friendlyMessage(404), /removido/i)
  assert.match(friendlyMessage(409), /conflita/i)
  assert.match(friendlyMessage(413), /15 MB/)
  assert.match(friendlyMessage(429), /Aguarde/)
  assert.match(friendlyMessage(500), /avise o suporte/i)
  assert.match(friendlyMessage(503), /avise o suporte/i)
})

test('mensagem em português do servidor (400/409/403) chega ao usuário', () => {
  assert.equal(friendlyMessage(409, { error: 'Já existe um cliente cadastrado com este telefone.' }), 'Já existe um cliente cadastrado com este telefone.')
  assert.equal(friendlyMessage(400, { error: 'Formato não suportado. Envie uma foto JPEG, PNG ou WebP.' }), 'Formato não suportado. Envie uma foto JPEG, PNG ou WebP.')
  assert.equal(friendlyMessage(403, { error: 'Você não pode alterar este agendamento.' }), 'Você não pode alterar este agendamento.')
})

test('texto técnico, em inglês ou de validação crua nunca aparece para o usuário', () => {
  assert.doesNotMatch(friendlyMessage(500, { error: 'Failed to fetch services' }), /Failed/)
  assert.doesNotMatch(friendlyMessage(400, { error: 'Invalid date param. Expected yyyy-MM-dd' }), /Invalid/)
  assert.match(friendlyMessage(400, { error: [{ message: 'Required', path: ['name'] }] }), /Confira os dados/)
  assert.doesNotMatch(friendlyMessage(404, { error: 'Not found' }), /Not found/)
})

test('mensagem própria de um status substitui a padrão', () => {
  assert.equal(friendlyMessage(503, { error: 'Armazenamento de fotos indisponível: UPLOADS_DIR não configurada' }, { 503: 'Fotos indisponíveis.' }), 'Fotos indisponíveis.')
})

test('resposta 5xx do servidor (HTML, não JSON) vira mensagem amigável', async () => {
  stubFetch(() => new Response('<!DOCTYPE html><html><title>500: Internal Server Error</title></html>', { status: 500, headers: { 'Content-Type': 'text/html' } }))
  try {
    await assert.rejects(apiRequest('/api/x'), (error: unknown) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.status, 500)
      assert.match(error.message, /avise o suporte/i)
      assert.doesNotMatch(error.message, /DOCTYPE|Internal Server/)
      return true
    })
  } finally {
    restoreFetch()
  }
})

test('sem internet (fetch falha): mensagem de conexão e status 0', async () => {
  stubFetch(() => { throw new TypeError('Failed to fetch') })
  try {
    await assert.rejects(apiRequest('/api/x'), (error: unknown) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.status, 0)
      assert.match(error.message, /Sem conexão/)
      return true
    })
  } finally {
    restoreFetch()
  }
})

test('sessão vencida é reconhecida; o texto original do servidor fica só em serverMessage', async () => {
  stubFetch(() => json(401, { error: 'Não autenticado.' }))
  try {
    await assert.rejects(apiRequest('/api/x'), (error: unknown) => {
      assert.ok(isSessionExpired(error))
      assert.equal((error as HttpError).serverMessage, 'Não autenticado.')
      return true
    })
  } finally {
    restoreFetch()
  }
})

test('sucesso devolve o JSON e envia o corpo como JSON com o cabeçalho certo', async () => {
  let seen: RequestInit | undefined
  stubFetch((_url, init) => {
    seen = init
    return json(200, { id: 'abc' })
  })
  try {
    const result = await apiRequest<{ id: string }>('/api/x', { method: 'POST', json: { name: 'Corte' } })
    assert.deepEqual(result, { id: 'abc' })
    assert.equal(seen?.body, JSON.stringify({ name: 'Corte' }))
    assert.equal((seen?.headers as Record<string, string>)['Content-Type'], 'application/json')
  } finally {
    restoreFetch()
  }
})

test('errorMessage: HttpError usa a mensagem amigável; TypeError vira conexão; outro usa o texto padrão', () => {
  assert.equal(errorMessage(new HttpError(409, 'Conflito.')), 'Conflito.')
  assert.match(errorMessage(new TypeError('x')), /Sem conexão/)
  assert.equal(errorMessage(new Error('qualquer coisa interna'), 'Texto padrão'), 'Texto padrão')
})
