import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_BARBEARIA_ID } from '../lib/tenant-host'
import { EvolutionConfigError, INSTANCIA_PADRAO, resolveWhatsapp } from '../lib/whatsapp-config'

describe('resolveWhatsapp: padrão (a América e a demo não mudam)', () => {
  it('sem as variáveis vale a instância e a barbearia da América', () => {
    assert.deepEqual(resolveWhatsapp({}), { instancia: 'barberos_main', barbeariaId: DEFAULT_BARBEARIA_ID })
    assert.equal(INSTANCIA_PADRAO, 'barberos_main')
  })

  it('variáveis vazias ou só com espaços contam como ausentes', () => {
    assert.deepEqual(resolveWhatsapp({ EVO_INSTANCE_NAME: '', WHATSAPP_BARBEARIA_ID: '  ' }), {
      instancia: 'barberos_main',
      barbeariaId: DEFAULT_BARBEARIA_ID,
    })
  })

  it('a América pode declarar o padrão de forma explícita', () => {
    assert.deepEqual(resolveWhatsapp({ EVO_INSTANCE_NAME: 'barberos_main', WHATSAPP_BARBEARIA_ID: DEFAULT_BARBEARIA_ID }), {
      instancia: 'barberos_main',
      barbeariaId: DEFAULT_BARBEARIA_ID,
    })
  })
})

describe('resolveWhatsapp: instalação de um cliente', () => {
  const cliente = { EVO_INSTANCE_NAME: 'vitorbarber69', WHATSAPP_BARBEARIA_ID: 'barbearia-vitorbarber69' }

  it('usa a instância e a barbearia do cliente', () => {
    assert.deepEqual(resolveWhatsapp(cliente), { instancia: 'vitorbarber69', barbeariaId: 'barbearia-vitorbarber69' })
  })

  it('tira espaços das pontas', () => {
    assert.equal(resolveWhatsapp({ EVO_INSTANCE_NAME: ' vitorbarber69 ', WHATSAPP_BARBEARIA_ID: ' barbearia-vitorbarber69 ' }).instancia, 'vitorbarber69')
  })

  it('a barbearia do cliente nunca é a da América', () => {
    assert.notEqual(resolveWhatsapp(cliente).barbeariaId, DEFAULT_BARBEARIA_ID)
  })
})

describe('resolveWhatsapp: falha fechada', () => {
  const erro = (env: Record<string, string>, trecho: RegExp) =>
    assert.throws(() => resolveWhatsapp(env), (e: unknown) => e instanceof EvolutionConfigError && trecho.test(e.message))

  it('só uma das duas variáveis é erro', () => {
    erro({ EVO_INSTANCE_NAME: 'vitorbarber69' }, /juntas/)
    erro({ WHATSAPP_BARBEARIA_ID: 'barbearia-vitorbarber69' }, /juntas/)
  })

  it('barbearia de cliente com a instância da América é erro (a mensagem sairia pelo número dela)', () => {
    erro({ EVO_INSTANCE_NAME: 'barberos_main', WHATSAPP_BARBEARIA_ID: 'barbearia-vitorbarber69' }, /da América/)
  })

  it('barbearia da América com a instância de um cliente é erro', () => {
    erro({ EVO_INSTANCE_NAME: 'vitorbarber69', WHATSAPP_BARBEARIA_ID: DEFAULT_BARBEARIA_ID }, /da América/)
  })

  it('nome de instância que sairia do caminho da URL é erro', () => {
    for (const ruim of ['../barberos_main', 'a/b', 'a b', 'a?x=1', 'a#b', '-comeca-com-hifen', 'x'.repeat(64), 'ação']) {
      erro({ EVO_INSTANCE_NAME: ruim, WHATSAPP_BARBEARIA_ID: 'barbearia-vitorbarber69' }, /inválido/)
    }
  })
})
