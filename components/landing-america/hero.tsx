import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { Estrela } from './estrela'

// Abertura: a faixa do Brasil (verde e amarelo) e dos Estados Unidos (vermelho e branco) se encontra no nome da casa.
// O movimento sozinho é só um: a faixa abre do centro para fora, uma vez.
export function Hero() {
  const horario = tenantConfig.businessHours[0]
  return (
    <section id="inicio" className="am-folhas relative overflow-hidden">
      <div className="am-faixa" aria-hidden="true">
        <span className="am-faixa__br" />
        <span className="am-faixa__us" />
        <Estrela className="am-faixa__estrela" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20 md:pb-28">
        <h1 className="am-hero-titulo am-slab text-[clamp(3.6rem,15vw,8.5rem)]">
          AMÉRICA
          <span className="am-script">Barbearia</span>
        </h1>

        <p className="am-entra mx-auto mt-20 max-w-xl text-lg font-semibold sm:mt-24 sm:text-xl">Técnica americana. Raiz brasileira.</p>
        <p className="am-entra am-script mt-2 text-3xl sm:text-4xl">Aqui se corta. E aqui se ensina.</p>

        <div className="am-entra mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/book" className="am-btn am-btn--vermelho w-full sm:w-auto">
            Agendar horário
          </Link>
          <a href="#cursos" className="am-btn am-btn--contorno w-full sm:w-auto">
            Conhecer os cursos
          </a>
        </div>

        <p className="am-entra am-t-suave mt-8 text-sm">
          {tenantConfig.city}
          {horario ? ` · ${horario.day}, ${horario.time}` : ''}
        </p>
      </div>
    </section>
  )
}
