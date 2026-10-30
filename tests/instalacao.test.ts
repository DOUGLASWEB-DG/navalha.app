import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { iniciaisDoNome, InstalacaoConfigError, linkWhatsapp, raizVaiParaPerfil, resolvePerfil, rotaDoPerfil, whatsappDaInstalacao, whatsappPublico } from '../lib/instalacao'

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

describe('formatos aceitos', () => {
  it('WhatsApp: celular (9 dígitos) e fixo (8 dígitos) brasileiros, com DDI 55', () => {
    assert.equal(whatsappDaInstalacao({ INSTALACAO_WHATSAPP: '5569992353661' }), '5569992353661')
    assert.equal(whatsappDaInstalacao({ INSTALACAO_WHATSAPP: '556932221234' }), '556932221234')
  })

  it('WhatsApp: sem DDI 55, DDD com zero ou número internacional é recusado', () => {
    for (const ruim of ['5169992353661', '5509992353661', '4412345678901', '556999235366']) {
      assert.throws(() => whatsappDaInstalacao({ INSTALACAO_WHATSAPP: ruim }), InstalacaoConfigError, ruim)
    }
  })

  it('Instagram: nomes reais passam; ponto no início, no fim ou repetido não (o Instagram também não aceita)', () => {
    for (const bom of ['vitor.barber69', 'a_b', 'Vitor_69', 'x']) assert.equal(resolvePerfil({ ...vitor, INSTALACAO_INSTAGRAM: bom })?.instagram, bom)
    for (const ruim of ['.vitor', 'vitor.', 'vi..tor']) erro({ ...vitor, INSTALACAO_INSTAGRAM: ruim }, /INSTALACAO_INSTAGRAM inválido/)
  })

  it('texto com quebra de linha ou caractere de controle é recusado', () => {
    erro({ ...vitor, INSTALACAO_SOBRE: 'linha 1\nlinha 2' }, /INSTALACAO_SOBRE com caractere inválido/)
    erro({ ...vitor, INSTALACAO_CIDADE: 'Porto\tVelho' }, /INSTALACAO_CIDADE com caractere inválido/)
    erro({ ...vitor, INSTALACAO_NOME: 'Vitor\u0000' }, /INSTALACAO_NOME com caractere inválido/)
  })
})

describe('whatsappPublico: nunca o da América para quem não é a América', () => {
  const AMERICA = '5569999630329'
  const sink = console.error
  const calado = <T,>(fn: () => T): T => {
    console.error = () => {}
    try {
      return fn()
    } finally {
      console.error = sink
    }
  }

  it('sem nenhuma variável (a América e a demo): o padrão da América, como sempre foi', () => {
    assert.equal(whatsappPublico(AMERICA, {}), AMERICA)
    assert.equal(whatsappPublico(AMERICA, { INSTALACAO_WHATSAPP: '  ', INSTALACAO_TIPO: '' }), AMERICA)
  })

  it('com o número da instalação: o dela', () => {
    assert.equal(whatsappPublico(AMERICA, { INSTALACAO_WHATSAPP: '5569992353661' }), '5569992353661')
    assert.equal(whatsappPublico(AMERICA, vitor), '5569992353661')
  })

  it('profissional (TIPO) sem número: SEM número, e não o da América', () => {
    assert.equal(whatsappPublico(AMERICA, { INSTALACAO_TIPO: 'barbeiro', INSTALACAO_NOME: 'Vitor' }), null)
  })

  it('número malformado: sem número e sem derrubar nada (a agenda segue), com erro no log', () => {
    let logou = false
    console.error = () => {
      logou = true
    }
    try {
      assert.equal(whatsappPublico(AMERICA, { INSTALACAO_WHATSAPP: '(69) 99235-3661' }), null)
    } finally {
      console.error = sink
    }
    assert.equal(logou, true)
    assert.equal(calado(() => whatsappPublico(AMERICA, { INSTALACAO_WHATSAPP: 'abc', INSTALACAO_TIPO: 'barbeiro' })), null)
  })
})

describe('rotaDoPerfil: o que o middleware faz', () => {
  it('sem INSTALACAO_TIPO: a raiz segue para a landing e /perfil não existe (404)', () => {
    assert.deepEqual(rotaDoPerfil('/', {}), { action: 'next' })
    assert.deepEqual(rotaDoPerfil('/perfil', {}), { action: 'notFound' })
    assert.deepEqual(rotaDoPerfil('/book', {}), { action: 'next' })
  })

  it('com INSTALACAO_TIPO: a raiz vira /perfil; /perfil e as outras rotas seguem', () => {
    assert.deepEqual(rotaDoPerfil('/', vitor), { action: 'rewrite', to: '/perfil' })
    assert.deepEqual(rotaDoPerfil('/perfil', vitor), { action: 'next' })
    assert.deepEqual(rotaDoPerfil('/book', vitor), { action: 'next' })
    assert.deepEqual(rotaDoPerfil('/dashboard', vitor), { action: 'next' })
  })

  it('configuração errada também manda a raiz para /perfil (onde o erro aparece), nunca para a landing', () => {
    assert.deepEqual(rotaDoPerfil('/', { ...vitor, INSTALACAO_TIPO: 'salao' }), { action: 'rewrite', to: '/perfil' })
  })

  it('só a raiz exata e /perfil exato são afetados', () => {
    assert.deepEqual(rotaDoPerfil('/perfil/x', {}), { action: 'next' })
    assert.deepEqual(rotaDoPerfil('/perfis', {}), { action: 'next' })
  })
})

describe('monograma do nome', () => {
  it('inicial das duas primeiras palavras que começam com letra', () => {
    assert.equal(iniciaisDoNome('Vitor Barber'), 'VB')
    assert.equal(iniciaisDoNome('Vitor Barber 69'), 'VB')
    assert.equal(iniciaisDoNome('  vitor   barber  '), 'VB')
  })

  it('uma palavra só, três palavras, acento e número no começo', () => {
    assert.equal(iniciaisDoNome('Vitor'), 'V')
    assert.equal(iniciaisDoNome('Ágata Barbearia Premium'), 'ÁB')
    assert.equal(iniciaisDoNome('69 Barber'), 'B')
    assert.equal(iniciaisDoNome('69'), '')
  })
})

describe('link do WhatsApp', () => {
  it('usa o número da instalação e codifica o texto', () => {
    assert.equal(linkWhatsapp('5569992353661', 'Olá! Quero agendar.'), 'https://wa.me/5569992353661?text=Ol%C3%A1!%20Quero%20agendar.')
  })
})
