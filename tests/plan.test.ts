import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  bloqueioDoCaminho,
  limiteBarbeiros,
  mensagemLimiteBarbeiros,
  planoPermite,
  recursoDoCaminho,
  resolvePlano,
  resumoDoPlano,
} from '../lib/plan'

describe('resolvePlano', () => {
  it('sem a variável o plano é completo (a América e a demo não mudam)', () => {
    assert.equal(resolvePlano({}), 'completo')
    assert.equal(resolvePlano({ NAVALHA_PLANO: '' }), 'completo')
    assert.equal(resolvePlano({ NAVALHA_PLANO: '   ' }), 'completo')
  })

  it('aceita os dois planos sem diferenciar maiúsculas nem espaços', () => {
    assert.equal(resolvePlano({ NAVALHA_PLANO: 'essencial' }), 'essencial')
    assert.equal(resolvePlano({ NAVALHA_PLANO: ' Essencial ' }), 'essencial')
    assert.equal(resolvePlano({ NAVALHA_PLANO: 'COMPLETO' }), 'completo')
  })

  it('valor inválido falha fechado: vale o plano mais restrito', () => {
    const original = console.error
    console.error = () => {}
    try {
      assert.equal(resolvePlano({ NAVALHA_PLANO: 'esencial' }), 'essencial')
      assert.equal(resolvePlano({ NAVALHA_PLANO: 'premium' }), 'essencial')
    } finally {
      console.error = original
    }
  })
})

describe('recursos e limites por plano', () => {
  it('completo libera tudo', () => {
    for (const recurso of ['financas', 'metas', 'produtos', 'whatsapp'] as const) {
      assert.equal(planoPermite(recurso, 'completo'), true, recurso)
    }
    assert.equal(limiteBarbeiros('completo'), 5)
  })

  it('essencial bloqueia finanças, metas, produtos e WhatsApp, e limita a 2 barbeiros', () => {
    for (const recurso of ['financas', 'metas', 'produtos', 'whatsapp'] as const) {
      assert.equal(planoPermite(recurso, 'essencial'), false, recurso)
    }
    assert.equal(limiteBarbeiros('essencial'), 2)
  })

  it('o resumo enviado à tela espelha as regras', () => {
    assert.deepEqual(resumoDoPlano('essencial'), {
      nome: 'essencial',
      recursos: { financas: false, metas: false, produtos: false, whatsapp: false },
      limiteBarbeiros: 2,
    })
    assert.equal(resumoDoPlano('completo').recursos.whatsapp, true)
  })

  it('a mensagem do limite nomeia o plano e o número', () => {
    assert.match(mensagemLimiteBarbeiros('essencial'), /Essencial.*2 barbeiros/)
  })
})

describe('recursoDoCaminho', () => {
  it('reconhece páginas e rotas de cada recurso, inclusive as filhas', () => {
    assert.equal(recursoDoCaminho('/dashboard/finances'), 'financas')
    assert.equal(recursoDoCaminho('/api/finances'), 'financas')
    assert.equal(recursoDoCaminho('/api/finances/stats'), 'financas')
    assert.equal(recursoDoCaminho('/api/finances/alerts'), 'financas')
    assert.equal(recursoDoCaminho('/dashboard/goals'), 'metas')
    assert.equal(recursoDoCaminho('/api/goals/abc123'), 'metas')
    assert.equal(recursoDoCaminho('/dashboard/products'), 'produtos')
    assert.equal(recursoDoCaminho('/api/products/abc123'), 'produtos')
  })

  it('não pega caminhos parecidos nem as telas que o plano sempre inclui', () => {
    for (const caminho of ['/dashboard', '/dashboard/appointments', '/dashboard/clients', '/dashboard/services', '/dashboard/users', '/dashboard/settings', '/api/appointments', '/api/clients', '/api/services', '/api/users', '/api/auth/me', '/api/book', '/book', '/login', '/api/finances-extra', '/dashboard/financesx', '/api/productsx']) {
      assert.equal(recursoDoCaminho(caminho), null, caminho)
    }
  })
})

describe('bloqueioDoCaminho (o que o middleware faz)', () => {
  it('no plano completo nada é barrado', () => {
    for (const caminho of ['/dashboard/finances', '/api/goals', '/api/products/1', '/dashboard']) {
      assert.deepEqual(bloqueioDoCaminho(caminho, 'completo'), { action: 'next' }, caminho)
    }
  })

  it('no essencial a API responde 403 e a página volta ao painel', () => {
    assert.deepEqual(bloqueioDoCaminho('/api/finances/stats', 'essencial'), { action: 'forbidden', recurso: 'financas' })
    assert.deepEqual(bloqueioDoCaminho('/api/goals', 'essencial'), { action: 'forbidden', recurso: 'metas' })
    assert.deepEqual(bloqueioDoCaminho('/api/products/9', 'essencial'), { action: 'forbidden', recurso: 'produtos' })
    assert.deepEqual(bloqueioDoCaminho('/dashboard/finances', 'essencial'), { action: 'redirect', recurso: 'financas' })
    assert.deepEqual(bloqueioDoCaminho('/dashboard/goals', 'essencial'), { action: 'redirect', recurso: 'metas' })
    assert.deepEqual(bloqueioDoCaminho('/dashboard/products', 'essencial'), { action: 'redirect', recurso: 'produtos' })
  })

  it('no essencial agenda, clientes, serviços, equipe e agendamento online continuam liberados', () => {
    for (const caminho of ['/dashboard', '/dashboard/appointments', '/dashboard/clients', '/dashboard/services', '/dashboard/users', '/api/appointments', '/api/clients', '/api/services', '/api/users', '/api/dashboard', '/api/auth/me', '/api/book', '/book']) {
      assert.deepEqual(bloqueioDoCaminho(caminho, 'essencial'), { action: 'next' }, caminho)
    }
  })
})
