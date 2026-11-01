import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { FOTO_MATEUS, FUNDO_PLACA } from '@/config/landing-america'
import { Selo } from './selo'

// Abertura: o que a casa é, dito em uma frase (a frase é o gancho da página), e a foto do Mateus Cremas, inteira, com o selo na quina.
// Atrás de tudo, a arte da placa da fachada (as bandeiras do Brasil e dos EUA) bem escurecida, como textura.
// Os dois chamados espelham o título: "Quero cortar" (agendar) e "Quero aprender" (cursos), cada um com uma frase em cima e outra
// embaixo. Movimento: a entrada acontece uma vez (texto em sequência, linha que se desenha, foto que se revela, moldura que desliza)
// e o único movimento contínuo é o selo girando devagar. O botão dourado do hero leva data-hero-agendar: o do cabeçalho
// se esconde enquanto este estiver na tela.
export function Hero() {
  const horario = tenantConfig.businessHours[0]
  return (
    <section id="inicio" className="hero-secao">
      <div className="hero-fundo" aria-hidden="true">
        <img src={FUNDO_PLACA.src} width={FUNDO_PLACA.width} height={FUNDO_PLACA.height} alt="" decoding="async" fetchPriority="low" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-12 sm:px-6 md:grid-cols-[1fr_1fr] md:gap-16 md:pb-32 md:pt-20">
        <div className="hero-texto">
          <span className="am-regua hero-rule" aria-hidden="true" />
          <h1 className="am-serif text-[clamp(2.7rem,5.7vw,4.8rem)] leading-[1.04]">
            <span className="sr-only">América Barbearia. </span>
            Aqui se corta.
            <br />
            E aqui se ensina.
          </h1>
          <p className="am-muted mt-6 max-w-md text-lg">Técnica americana. Raiz brasileira.</p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-6">
            <div className="hero-cta">
              <p className="hero-cta__rotulo">Quero cortar</p>
              <Link href="/book" className="am-btn am-btn--ouro" data-hero-agendar>
                Agendar horário
              </Link>
              <p className="hero-cta__nota">Escolha o horário · confirmação em minutos</p>
            </div>
            <div className="hero-cta">
              <p className="hero-cta__rotulo">Quero aprender</p>
              <a href="#cursos" className="am-btn am-btn--linha hero-aprender">
                Conhecer os cursos
              </a>
              <p className="hero-cta__nota">Com o Mateus Cremas, direto no WhatsApp</p>
            </div>
          </div>

          <p className="am-muted mt-10 text-sm">
            {tenantConfig.city}
            {horario ? ` · ${horario.day}, ${horario.time}` : ''}
          </p>
        </div>

        <figure className="mx-auto w-full max-w-lg md:max-w-none">
          <div className="am-moldura hero-photo">
            <img
              src={FOTO_MATEUS.src}
              width={FOTO_MATEUS.width}
              height={FOTO_MATEUS.height}
              alt="Mateus Cremas, barbeiro e dono da América, segurando uma tesoura de corte"
              className="am-moldura__foto"
              fetchPriority="high"
            />
            <Selo className="am-selo-hero hero-seal" id="am-selo-hero" />
          </div>
          <figcaption className="am-legenda">
            <span className="am-serif">Mateus Cremas</span> · barbeiro e dono
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
