import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { InstalacaoConfigError, linkWhatsapp, raizVaiParaPerfil, resolvePerfil, whatsappDaInstalacao } from '../lib/instalacao'

const vitor = {
  INSTALACAO_TIPO: 'barbeiro',
  INSTALACAO_NOME: 'Vitor Barber 69',
  INSTALACAO_WHATSAPP: '5569992353661',
  INSTALACAO_INSTAGRAM: 'vitor.barber69',
  INSTALACAO_CIDADE: 'Porto Velho',
  INSTALACAO_SOBRE: 'Barbeiro em Porto Velho.',
}
const erro = (env: Record<string, string>, trecho: RegExp) =>
  assert.throws(() => resolvePerfil(env), (e: unknown) => e instanceof InstalacaoConfigError && trecho.test(e.message))

describe('instalação padrão (a América e a demo não mudam)', () => {
  it('sem variáveis: nada de perfil, nada de número próprio, raiz continua na landing', () => {
    assert.equal(resolvePerfil({}), null)
    assert.equal(whatsappDaInstalacao({}), null)
    assert.equal(raizVaiParaPerfil({}), false)
  })

  it('variáveis vazias ou só com espaços contam como ausentes', () => {
    const env = { INSTALACAO_TIPO: '  ', INSTALACAO_WHATSAPP: '', INSTALACAO_NOME: '   ' }
    assert.equal(resolvePerfil(env), null)
    assert.equal(whatsappDaInstalacao(env), null)
    assert.equal(raizVaiParaPerfil(env), false)
  })
})

describe('perfil de barbeiro', () => {
  it('lê tudo o que o Vitor define', () => {
    assert.deepEqual(resolvePerfil(vitor), {
      tipo: 'barbeiro',
      nome: 'Vitor Barber 69',
      whatsapp: '5569992353661',
      instagram: 'vitor.barber69',
      cidade: 'Porto Velho',
      sobre: 'Barbeiro em Porto Velho.',
    })
    assert.equal(raizVaiParaPerfil(vitor), true)
  })

  it('os campos opcionais ficam nulos, e só o nome e o WhatsApp são obrigatórios', () => {
    const p = resolvePerfil({ INSTALACAO_TIPO: 'barbeiro', INSTALACAO_NOME: 'Fulano', INSTALACAO_WHATSAPP: '5569999999999' })
    assert.equal(p?.instagram, null)
    assert.equal(p?.cidade, null)
    assert.equal(p?.sobre, null)
  })

  it('tipo em maiúsculas e com espaços vale', () => {
    assert.equal(resolvePerfil({ ...vitor, INSTALACAO_TIPO: ' Barbeiro ' })?.tipo, 'barbeiro')
  })
})

describe('falha fechada: configuração errada nunca cai no contato da América', () => {
  it('tipo desconhecido, sem nome ou sem WhatsApp é erro', () => {
    erro({ ...vitor, INSTALACAO_TIPO: 'salao' }, /único valor aceito/)
    erro({ ...vitor, INSTALACAO_NOME: '' }, /INSTALACAO_NOME é obrigatório/)
    const { INSTALACAO_WHATSAPP: _w, ...semZap } = vitor
    erro(semZap, /INSTALACAO_WHATSAPP é obrigatório/)
  })

  it('WhatsApp com formato inválido é erro (inclusive com símbolos, letras ou curto demais)', () => {
    for (const ruim of ['(69) 99235-3661', '69992353661', '+5569992353661', '5569992353661abc', '55699923536611234']) {
      assert.throws(() => whatsappDaInstalacao({ INSTALACAO_WHATSAPP: ruim }), InstalacaoConfigError, ruim)
    }
  })

  it('Instagram com @, espaço ou link é erro; textos longos demais são erro', () => {
    for (const ruim of ['@vitor.barber69', 'vitor barber', 'https://instagram.com/x', 'a'.repeat(31)]) {
      erro({ ...vitor, INSTALACAO_INSTAGRAM: ruim }, /INSTALACAO_INSTAGRAM inválido/)
    }
    erro({ ...vitor, INSTALACAO_NOME: 'x'.repeat(81) }, /NOME muito longo/)
    erro({ ...vitor, INSTALACAO_SOBRE: 'x'.repeat(601) }, /SOBRE muito longo/)
  })

  it('erro de configuração ainda manda a raiz para /perfil (onde o erro aparece), e não para a landing', () => {
    assert.equal(raizVaiParaPerfil({ ...vitor, INSTALACAO_TIPO: 'salao' }), true)
  })
})

describe('link do WhatsApp', () => {
  it('usa o número da instalação e codifica o texto', () => {
    assert.equal(linkWhatsapp('5569992353661', 'Olá! Quero agendar.'), 'https://wa.me/5569992353661?text=Ol%C3%A1!%20Quero%20agendar.')
  })
})
