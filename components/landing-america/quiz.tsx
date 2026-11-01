"use client"

import { useEffect, useRef, useState } from 'react'
import {
  CURSOS,
  PERGUNTAS_DO_QUIZ,
  linkWhatsapp,
  mensagemDoQuiz,
  resultadoDoQuiz,
} from '@/lib/landing-america'

// "Qual curso é o seu?": 3 perguntas e o resultado vira uma mensagem pronta no WhatsApp. Nada é guardado no servidor:
// as respostas só existem nesta tela e na mensagem que a própria pessoa decide enviar.
export function QuizCurso({ numero }: { numero: string }) {
  const [respostas, setRespostas] = useState<number[]>([])
  const foco = useRef<HTMLHeadingElement>(null)
  const jaMontou = useRef(false)
  const etapa = respostas.length
  const pronto = etapa === PERGUNTAS_DO_QUIZ.length
  const pergunta = pronto ? null : PERGUNTAS_DO_QUIZ[etapa]!

  // A cada passo o foco vai para o título novo: quem usa leitor de tela ou teclado não fica perdido
  useEffect(() => {
    if (!jaMontou.current) {
      jaMontou.current = true
      return
    }
    foco.current?.focus()
  }, [etapa])

  const curso = pronto ? CURSOS[resultadoDoQuiz(respostas)] : null

  return (
    <div className="am-painel mt-20" role="group" aria-labelledby="quiz-titulo">
      <span className="am-regua" aria-hidden="true" />
      <h3 id="quiz-titulo" className="am-serif text-3xl sm:text-4xl">
        Qual curso é o seu?
      </h3>

      {!pronto && pergunta && (
        <div className="mt-6">
          <p className="am-muted text-sm" aria-live="polite">
            Pergunta {etapa + 1} de {PERGUNTAS_DO_QUIZ.length}
          </p>
          <h4 ref={foco} tabIndex={-1} className="am-serif mt-2 text-2xl font-medium outline-none sm:text-3xl">
            {pergunta.texto}
          </h4>
          <div className="mt-5">
            {pergunta.opcoes.map((opcao, i) => (
              <button key={opcao.texto} type="button" className="am-opcao" onClick={() => setRespostas((r) => [...r, i])}>
                <span className="text-base sm:text-lg">{opcao.texto}</span>
              </button>
            ))}
          </div>
          {etapa > 0 && (
            <button type="button" className="am-link mt-4 inline-flex min-h-11 items-center text-sm" onClick={() => setRespostas((r) => r.slice(0, -1))}>
              Voltar
            </button>
          )}
        </div>
      )}

      {pronto && curso && (
        <div className="mt-6" aria-live="polite">
          <p className="am-muted text-sm">Pelo que você respondeu</p>
          <h4 ref={foco} tabIndex={-1} className="am-serif mt-2 text-3xl font-medium leading-tight outline-none sm:text-4xl">
            O <span className="am-ouro-claro italic">{curso.nome}</span> parece ser o seu caminho.
          </h4>
          <p className="am-muted mt-4 max-w-xl">
            Como funciona, as turmas e os valores a gente explica pelo WhatsApp. A conversa já vai com as suas respostas.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={linkWhatsapp(numero, mensagemDoQuiz(curso, respostas))}
              target="_blank"
              rel="noopener noreferrer"
              className="am-btn am-btn--ouro"
            >
              Quero saber como funciona
            </a>
            <button type="button" className="am-link inline-flex min-h-11 items-center justify-center text-sm" onClick={() => setRespostas([])}>
              Refazer o quiz
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
