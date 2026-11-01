import { tenantConfig } from '@/config/tenant'
import { linkWhatsapp, mensagemSobreOsCursos } from '@/lib/landing-america'
import { Selo } from './selo'

// Só o que o dono confirmou: o Mateus Cremas é barbeiro, dono da América e quem ensina os cursos.
export function QuemEnsina() {
  return (
    <section id="quem-ensina" aria-labelledby="quem-titulo" className="am-folhas">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,240px)_1fr] md:gap-16 md:py-24">
        <Selo className="mx-auto w-48 md:w-full" />
        <div>
          <p className="am-script text-3xl sm:text-4xl">Quem ensina</p>
          <h2 id="quem-titulo" className="am-slab mt-1 text-4xl sm:text-5xl">
            Mateus Cremas
          </h2>
          <p className="mt-4 max-w-xl text-lg">Barbeiro e dono da América. É ele quem ensina os cursos.</p>
          <p className="am-t-suave mt-2 max-w-xl">Quer saber como é? Chame no WhatsApp e converse com a gente.</p>
          <a
            href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemSobreOsCursos())}
            target="_blank"
            rel="noopener noreferrer"
            className="am-btn am-btn--ouro mt-6"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
