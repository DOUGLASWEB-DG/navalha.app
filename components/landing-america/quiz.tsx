"use client"

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  CURSOS,
  PERGUNTAS_DO_QUIZ,
  linkWhatsapp,
  mensagemDoQuiz,
  resultadoDoQuiz,
} from '@/lib/landing-america'

const dois = (n: number) => String(n).padStart(2, '0')

// "Qual curso é o seu?": 3 perguntas e o resultado vira uma mensagem pronta no WhatsApp. Nada é guardado no servidor:
// as respostas só existem nesta tela e na mensagem que a própria pessoa decide enviar.
// Layout: à esquerda o título, uma frase, a barra de progresso (3 segmentos) e o contador; à direita a pergunta e as opções.
export function QuizCurso({ numero }: { numero: string }) {
  const [respostas, setRespostas] = useState<number[]>([])
  const foco = useRef<HTMLHeadingElement>(null)
  const painel = useRef<HTMLDivElement>(null)
  const jaMontou = useRef(false)
  const etapa = respostas.length
  const total = PERGUNTAS_DO_QUIZ.length
  const pronto = etapa === total
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

  // Luz dourada discreta que segue o cursor dentro do cartão (só com mouse; escreve variáveis CSS, sem re-renderizar)
  const aoMover = (e: PointerEvent<HTMLDivElement>) => {
    const el = painel.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div ref={painel} onPointerMove={aoMover} className="am-painel am-quiz mt-20" role="group" aria-labelledby="quiz-titulo">
      <div className="am-quiz__lado">
        <span className="am-regua" aria-hidden="true" />
        <h3 id="quiz-titulo" className="am-serif text-3xl sm:text-4xl">
          Qual curso é o seu?
        </h3>
        <p className="am-muted mt-3">Três perguntas rápidas. No final, a conversa já vai com as suas respostas.</p>
        <div className="am-quiz__progresso" aria-hidden="true">
          {PERGUNTAS_DO_QUIZ.map((p, i) => (
            <span key={p.id} className={i < etapa ? 'is-feito' : i === etapa ? 'is-atual' : ''} />
          ))}
        </div>
        <p className="am-quiz__contador am-num" aria-hidden="true">
          {dois(Math.min(etapa + 1, total))} / {dois(total)}
        </p>
      </div>

      <div className="am-quiz__principal">
        {!pronto && pergunta && (
          <div key={etapa} className="am-quiz__passo">
            <p className="sr-only" aria-live="polite">
              Pergunta {etapa + 1} de {total}
            </p>
            <h4 ref={foco} tabIndex={-1} className="am-serif text-2xl font-medium outline-none sm:text-3xl">
              {pergunta.texto}
            </h4>
            <div className="mt-6">
              {pergunta.opcoes.map((opcao, i) => (
                <button key={opcao.texto} type="button" className="am-opcao" onClick={() => setRespostas((r) => [...r, i])}>
                  <span className="am-opcao__n am-num" aria-hidden="true">
                    {dois(i + 1)}
                  </span>
                  <span className="am-opcao__t">{opcao.texto}</span>
                  <span className="am-opcao__seta" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
            {etapa > 0 && (
              <button type="button" className="am-link mt-3 inline-flex min-h-11 items-center text-sm" onClick={() => setRespostas((r) => r.slice(0, -1))}>
                Voltar
              </button>
            )}
          </div>
        )}

        {pronto && curso && (
          <div key="resultado" className="am-quiz__passo" aria-live="polite">
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
    </div>
  )
}
