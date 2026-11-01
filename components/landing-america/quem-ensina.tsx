import { tenantConfig } from '@/config/tenant'
import { linkWhatsapp, mensagemSobreOsCursos } from '@/lib/landing-america'
import { Selo } from './selo'

// Só o que o dono confirmou: o Mateus Cremas é barbeiro, dono da América e quem ensina os cursos.
export function QuemEnsina() {
  return (
    <section id="quem-ensina" aria-labelledby="quem-titulo" className="am-sec">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[minmax(0,220px)_1fr] md:gap-20 md:py-28">
        <Selo className="mx-auto w-44 md:w-full" id="am-selo-ensina" />
        <div>
          <span className="am-regua" aria-hidden="true" />
          <h2 id="quem-titulo" className="am-serif text-4xl sm:text-5xl">
            Mateus Cremas
          </h2>
          <p className="am-serif am-ouro-claro mt-3 text-2xl font-medium italic">Quem ensina na América</p>
          <p className="mt-5 max-w-xl text-lg">Barbeiro e dono da América. É ele quem ensina os cursos.</p>
          <p className="am-muted mt-2 max-w-xl">Quer saber como é? Chame no WhatsApp e converse com a gente.</p>
          <a
            href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemSobreOsCursos())}
            target="_blank"
            rel="noopener noreferrer"
            className="am-btn am-btn--ouro mt-7"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
