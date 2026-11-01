import { tenantConfig } from '@/config/tenant'
import { CURSOS, ORDEM_DOS_CURSOS, linkWhatsapp, mensagemDoCurso } from '@/lib/landing-america'
import { QuizCurso } from './quiz'

// Os três cursos como "portas": cada cartão mostra o nome e uma pergunta. Como funciona, turmas e valores ficam para a conversa
// no WhatsApp (é o objetivo da página). O que o cartão afirma é só o que o dono já disse: os três cursos existem e quem ensina é ele.
export function Cursos() {
  return (
    <section id="cursos" aria-labelledby="cursos-titulo" data-sem-zap className="am-sec">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <span className="am-regua" aria-hidden="true" />
        <h2 id="cursos-titulo" className="am-serif text-4xl sm:text-5xl">
          Cursos da América
        </h2>
        <p className="am-muted mt-5 max-w-2xl text-lg">
          Com o Mateus Cremas, barbeiro e dono da casa. O conteúdo, as turmas e os valores a gente explica pelo WhatsApp: é só chamar.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ORDEM_DOS_CURSOS.map((id) => {
            const curso = CURSOS[id]
            return (
              <article key={id} className="am-card">
                <h3 className="am-serif text-3xl leading-tight">{curso.titulo}</h3>
                <p className="am-serif am-ouro-claro text-xl font-medium italic leading-snug">{curso.gancho}</p>
                <p className="am-muted text-sm">Conteúdo, turmas e valores: conversamos pelo WhatsApp.</p>
                <a
                  href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemDoCurso(curso))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="am-btn am-btn--linha mt-auto"
                >
                  Quero saber como funciona
                </a>
              </article>
            )
          })}
        </div>

        <QuizCurso numero={tenantConfig.whatsappNumber} />
      </div>
    </section>
  )
}
