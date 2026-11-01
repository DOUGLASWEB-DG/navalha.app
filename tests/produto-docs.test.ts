import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CAPITULOS, itensDoSumario, numeroDe, tituloDe } from '../lib/produto-docs'

describe('estrutura da documentação do produto', () => {
  const itens = itensDoSumario()

  it('todo id (capítulo ou seção) é único, para os atalhos #id não colidirem', () => {
    const ids = itens.map((item) => item.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('ids só têm minúsculas, números e hífen (viram âncora de URL)', () => {
    for (const item of itens) assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, item.id)
  })

  it('a numeração segue a norma: capítulo "N" e seções "N.1", "N.2"... sem buracos', () => {
    CAPITULOS.forEach((cap, i) => {
      assert.equal(numeroDe(cap.id), String(i + 1))
      cap.secoes.forEach((sec, j) => assert.equal(numeroDe(sec.id), `${i + 1}.${j + 1}`))
    })
  })

  it('todo capítulo tem ao menos uma seção e todo título tem texto', () => {
    for (const cap of CAPITULOS) {
      assert.ok(cap.secoes.length > 0, cap.id)
      assert.ok(cap.titulo.trim().length > 0, cap.id)
      for (const sec of cap.secoes) assert.ok(sec.titulo.trim().length > 0, sec.id)
    }
  })

  it('o sumário lista cada capítulo seguido das suas seções', () => {
    assert.equal(itens[0].nivel, 1)
    assert.equal(itens[1].nivel, 2)
    const capitulos = itens.filter((item) => item.nivel === 1).length
    assert.equal(capitulos, CAPITULOS.length)
    assert.equal(itens.length, CAPITULOS.length + CAPITULOS.reduce((soma, cap) => soma + cap.secoes.length, 0))
  })

  it('busca por id devolve número e título; id desconhecido devolve null', () => {
    assert.equal(numeroDe('visao-geral'), '1.1')
    assert.equal(tituloDe('visao-geral'), 'Visão geral')
    assert.equal(numeroDe('nao-existe'), null)
    assert.equal(tituloDe('nao-existe'), null)
  })

  it('a página escreve cada capítulo e cada seção da estrutura, na mesma ordem (a numeração e o sumário não mentem)', () => {
    const fonte = readFileSync(new URL('../app/produto/page.tsx', import.meta.url), 'utf8')
    const naPagina = [...fonte.matchAll(/<(?:Capitulo|DocSection)\s+id="([^"]+)"/g)].map((m) => m[1])
    assert.deepEqual(naPagina, itens.map((item) => item.id))
  })

  it('o atalho no celular fica logo depois da apresentação, como pedido', () => {
    const ids = CAPITULOS.map((cap) => cap.id)
    assert.ok(ids.indexOf('instalacao') === ids.indexOf('apresentacao') + 1)
  })
})
