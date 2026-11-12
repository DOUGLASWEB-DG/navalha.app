import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CURSOS,
  ORDEM_DOS_CURSOS,
  PERGUNTAS_DO_QUIZ,
  enderecoSemCep,
  linkDoMapa,
  linkWhatsapp,
  mensagemDoCurso,
  mensagemDoQuiz,
  mensagemDoServico,
  mensagemGeral,
  mensagemSobreOsCursos,
  resultadoDoQuiz,
} from '../lib/landing-america'

test('os três cursos do dono, com os nomes que ele usa', () => {
  assert.deepEqual(ORDEM_DOS_CURSOS, ['barbeiro', 'aperfeicoamento', 'quimicas'])
  assert.equal(CURSOS.barbeiro.nome, 'Curso de Barbeiro Profissional')
  assert.equal(CURSOS.aperfeicoamento.nome, 'Curso de Aperfeiçoamento')
  assert.equal(CURSOS.quimicas.nome, 'Curso de Químicas em Geral')
})

test('o gancho de cada curso é uma pergunta, nunca uma promessa', () => {
  for (const id of ORDEM_DOS_CURSOS) assert.ok(CURSOS[id].gancho.trim().endsWith('?'), id)
})

test('o quiz tem 3 perguntas e cada uma tem opções que apontam para cursos que existem', () => {
  assert.equal(PERGUNTAS_DO_QUIZ.length, 3)
  for (const p of PERGUNTAS_DO_QUIZ) {
    assert.ok(p.opcoes.length >= 2, p.id)
    for (const o of p.opcoes) assert.ok(o.curso in CURSOS, `${p.id}: ${o.texto}`)
  }
})

test('quiz: todas as respostas no mesmo caminho levam ao curso desse caminho', () => {
  assert.equal(resultadoDoQuiz([0, 0, 0]), 'barbeiro')
  assert.equal(resultadoDoQuiz([1, 1, 1]), 'aperfeicoamento')
  assert.equal(resultadoDoQuiz([2, 2, 2]), 'quimicas')
})

test('quiz: a maioria vence', () => {
  assert.equal(resultadoDoQuiz([1, 1, 0]), 'aperfeicoamento') // 2 votos para aperfeiçoamento
  assert.equal(resultadoDoQuiz([0, 2, 2]), 'quimicas') // 2 votos para químicas
  assert.equal(resultadoDoQuiz([2, 0, 0]), 'barbeiro') // 2 votos para barbeiro (a 3ª opção da 1ª pergunta é aperfeiçoamento)
})

test('quiz: no empate de três, vale o que a pessoa mais quer aprender (a 2ª pergunta)', () => {
  // 1ª: barbeiro, 2ª: químicas, 3ª: aperfeiçoamento -> cada curso com 1 voto
  assert.equal(resultadoDoQuiz([0, 2, 1]), 'quimicas')
  // 1ª: aperfeiçoamento, 2ª: barbeiro, 3ª: químicas
  assert.equal(resultadoDoQuiz([1, 0, 2]), 'barbeiro')
})

test('quiz: respostas faltando ou fora do intervalo são recusadas, em vez de chutar um curso', () => {
  assert.throws(() => resultadoDoQuiz([0, 0]), RangeError)
  assert.throws(() => resultadoDoQuiz([0, 0, 0, 0]), RangeError)
  assert.throws(() => resultadoDoQuiz([0, 0, 9]), RangeError)
  assert.throws(() => resultadoDoQuiz([0, -1, 0]), RangeError)
})

test('mensagens: levam a marca "Vim pelo site da América" e o nome do curso', () => {
  assert.match(mensagemDoCurso(CURSOS.barbeiro), /^Olá! Vim pelo site da América/)
  assert.match(mensagemDoCurso(CURSOS.barbeiro), /Curso de Barbeiro Profissional/)
  const quiz = mensagemDoQuiz(CURSOS.quimicas, [2, 2, 2])
  assert.match(quiz, /Vim pelo site da América/)
  assert.match(quiz, /Curso de Químicas em Geral/)
  assert.match(quiz, /quero aprender química/)
  assert.match(mensagemGeral(), /Vim pelo site da América/)
  assert.match(mensagemSobreOsCursos(), /Vim pelo site da América/)
  assert.match(mensagemDoServico('Corte'), /Corte/)
})

test('endereço sem o CEP (o do config tem um dígito a mais)', () => {
  assert.equal(
    enderecoSemCep('Rua Casemiro de Abreu, 3140 - Colonial, Ariquemes - RO, 768873-762'),
    'Rua Casemiro de Abreu, 3140 - Colonial, Ariquemes - RO',
  )
  assert.equal(enderecoSemCep('Rua A, 10 - Centro, 76873-762'), 'Rua A, 10 - Centro')
  assert.equal(enderecoSemCep('Rua A, 10 - Centro'), 'Rua A, 10 - Centro')
})

test('link do mapa: busca pelo endereço, sem o CEP, codificada', () => {
  const link = linkDoMapa('Rua Casemiro de Abreu, 3140 - Colonial, Ariquemes - RO, 768873-762')
  assert.ok(link.startsWith('https://www.google.com/maps/search/?api=1&query='))
  assert.ok(link.includes(encodeURIComponent('Rua Casemiro de Abreu, 3140')))
  assert.ok(!link.includes('768873'), 'o CEP errado não pode ir na busca')
})

test('link do WhatsApp: só dígitos no número e texto codificado', () => {
  const link = linkWhatsapp('(69) 99963-0329', 'Olá! Quero um corte & barba?')
  assert.equal(link, 'https://wa.me/69999630329?text=Ol%C3%A1!%20Quero%20um%20corte%20%26%20barba%3F')
})
