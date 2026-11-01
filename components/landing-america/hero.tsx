import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { FOTOS } from '@/config/landing-america'
import { Selo } from './selo'

// Abertura: o que a casa é, dito em uma frase (a frase é o gancho da página), e UMA foto grande, inteira, com o selo na quina.
// O único movimento sozinho é a foto se revelando.
export function Hero() {
  const horario = tenantConfig.businessHours[0]
  const foto = FOTOS.combo
  return (
    <section id="inicio">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-20 md:pb-32 md:pt-20">
        <div>
          <span className="am-regua am-sobe" aria-hidden="true" />
          <h1 className="am-serif am-sobe text-[clamp(2.7rem,5.7vw,4.8rem)] leading-[1.04]">
            <span className="sr-only">América Barbearia. </span>
            Aqui se corta.
            <br />
            E aqui se ensina.
          </h1>
          <p className="am-sobe am-muted mt-6 max-w-md text-lg">Técnica americana. Raiz brasileira.</p>

          <div className="am-sobe mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="am-btn am-btn--ouro">
              Agendar horário
            </Link>
            <a href="#cursos" className="am-btn am-btn--linha">
              Conhecer os cursos
            </a>
          </div>

          <p className="am-sobe am-muted mt-8 text-sm">
            {tenantConfig.city}
            {horario ? ` · ${horario.day}, ${horario.time}` : ''}
          </p>
        </div>

        <div className="am-moldura mx-auto w-full max-w-md md:max-w-none">
          <img
            src={foto.src}
            width={foto.width}
            height={foto.height}
            alt="Corte degradê com barba feito na América, visto de perfil"
            className="am-moldura__foto"
            fetchPriority="high"
          />
          <Selo className="am-selo-hero" id="am-selo-hero" />
        </div>
      </div>
    </section>
  )
}
