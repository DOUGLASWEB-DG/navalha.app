import { tenantConfig } from '@/config/tenant'
import { CURSOS, ORDEM_DOS_CURSOS, linkWhatsapp, mensagemDoCurso } from '@/lib/landing-america'
import { QuizCurso } from './quiz'

// Os três cursos como "portas": cada cartão mostra o nome e uma pergunta. Como funciona, turmas e valores ficam para a conversa
// no WhatsApp (é o objetivo da página). O que o cartão afirma é só o que o dono já disse: os três cursos existem e quem ensina é ele.
export function Cursos() {
  return (
    <section id="cursos" aria-labelledby="cursos-titulo" data-sem-zap className="am-estrelas">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <p className="am-script text-3xl sm:text-4xl">Aqui se ensina</p>
        <h2 id="cursos-titulo" className="am-slab mt-1 text-4xl sm:text-5xl">
          Cursos da América
        </h2>
        <p className="am-t-suave mt-4 max-w-2xl text-lg">
          Com o Mateus Cremas, barbeiro e dono da casa. O conteúdo, as turmas e os valores a gente explica pelo WhatsApp: é só chamar.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ORDEM_DOS_CURSOS.map((id) => {
            const curso = CURSOS[id]
            return (
              <article key={id} className="am-curso">
                <p className="am-t-suave text-sm">Curso</p>
                <h3 className="am-slab am-t-ouro text-3xl leading-tight">{curso.titulo}</h3>
                <p className="text-lg leading-snug">{curso.gancho}</p>
                <p className="am-t-suave text-sm">Conteúdo, turmas e valores: conversamos pelo WhatsApp.</p>
                <a
                  href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemDoCurso(curso))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="am-btn am-btn--vermelho mt-auto"
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
