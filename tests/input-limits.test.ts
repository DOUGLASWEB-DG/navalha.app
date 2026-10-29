import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'
import { bookingSchema } from '../lib/booking-schema'
import { LIMITES } from '../lib/input-limits'

const valido = { name: 'Fulano', phone: '(69) 99999-1234', serviceIds: ['s1'], date: '2026-11-02', time: '10:00', notes: 'cabelo curto' }
const recusa = (corpo: unknown) => assert.equal(bookingSchema.safeParse(corpo).success, false)
const aceita = (corpo: unknown) => assert.equal(bookingSchema.safeParse(corpo).success, true)

describe('agendamento público: o formulário gigante é recusado', () => {
  it('um pedido normal passa', () => {
    aceita(valido)
    aceita({ ...valido, notes: undefined, serviceIds: undefined, serviceId: 's1' })
  })

  it('observações: até o limite passa; acima dele, recusa', () => {
    aceita({ ...valido, notes: 'a'.repeat(LIMITES.notas) })
    recusa({ ...valido, notes: 'a'.repeat(LIMITES.notas + 1) })
  })

  it('observações de 5 MB são recusadas em poucos milissegundos, sem travar', () => {
    const gigante = 'x'.repeat(5 * 1024 * 1024)
    const inicio = Date.now()
    recusa({ ...valido, notes: gigante })
    assert.ok(Date.now() - inicio < 500, `demorou ${Date.now() - inicio} ms`)
  })

  it('lista de serviços: até o limite passa; acima dele, recusa (inclusive lista enorme)', () => {
    aceita({ ...valido, serviceIds: Array.from({ length: LIMITES.ids }, (_, i) => `s${i}`) })
    recusa({ ...valido, serviceIds: Array.from({ length: LIMITES.ids + 1 }, (_, i) => `s${i}`) })
    const inicio = Date.now()
    recusa({ ...valido, serviceIds: Array.from({ length: 50_000 }, (_, i) => `s${i}`) })
    assert.ok(Date.now() - inicio < 1000, `demorou ${Date.now() - inicio} ms`)
  })

  it('ids, telefone e nome acima do limite são recusados', () => {
    recusa({ ...valido, serviceIds: ['x'.repeat(LIMITES.id + 1)] })
    recusa({ ...valido, serviceId: 'x'.repeat(LIMITES.id + 1) })
    recusa({ ...valido, barberId: 'x'.repeat(LIMITES.id + 1) })
    recusa({ ...valido, phone: '6'.repeat(LIMITES.telefone + 1) })
    recusa({ ...valido, phone: '(69) 99999-1234' + ' '.repeat(5000) })
    recusa({ ...valido, name: 'a'.repeat(61) })
  })

  it('nome com quebra de linha ou link continua recusado (vai para o texto do WhatsApp)', () => {
    recusa({ ...valido, name: 'Fulano\nhttp://x' })
    recusa({ ...valido, name: 'veja www.site.com' })
  })

  it('data, horário e telefone inválidos continuam recusados', () => {
    recusa({ ...valido, date: '02/11/2026' })
    recusa({ ...valido, time: '10h' })
    recusa({ ...valido, phone: '123' })
  })
})

describe('limites compartilhados', () => {
  it('são números positivos e coerentes', () => {
    for (const [nome, valor] of Object.entries(LIMITES)) assert.ok(Number.isInteger(valor) && valor > 0, nome)
    assert.ok(LIMITES.senha >= 72, 'a senha precisa caber pelo menos o que o bcrypt usa (72 bytes)')
    assert.ok(LIMITES.email >= 254)
  })
})

describe('cabeçalhos de segurança do app', () => {
  it('next.config.js manda os cabeçalhos em todas as rotas', async () => {
    const config = createRequire(import.meta.url)('../next.config.js')
    assert.equal(config.poweredByHeader, false)
    const [regra] = await config.headers()
    assert.equal(regra.source, '/:path*')
    const h = Object.fromEntries(regra.headers.map((x: { key: string; value: string }) => [x.key, x.value]))
    assert.equal(h['X-Frame-Options'], 'DENY')
    assert.equal(h['X-Content-Type-Options'], 'nosniff')
    assert.match(h['Strict-Transport-Security'], /max-age=\d+/)
    assert.match(h['Content-Security-Policy'], /frame-ancestors 'none'/)
    // a CSP desta etapa não restringe scripts nem estilos: nada que as telas carregam pode quebrar
    assert.doesNotMatch(h['Content-Security-Policy'], /script-src|style-src|default-src|img-src/)
  })
})
