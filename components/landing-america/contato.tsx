import { Clock, Instagram, MapPin, Phone } from 'lucide-react'
import { tenantConfig } from '@/config/tenant'
import { linkWhatsapp, mensagemGeral } from '@/lib/landing-america'

// Horário, endereço, Instagram, WhatsApp e mapa: tudo vem do tenantConfig (uma fonte só, a mesma do resto do sistema).
export function Contato() {
  const itens = [
    { icone: MapPin, rotulo: 'Endereço', valor: tenantConfig.address, link: tenantConfig.googleMapsLink },
    { icone: Phone, rotulo: 'WhatsApp', valor: tenantConfig.phoneDisplay, link: linkWhatsapp(tenantConfig.whatsappNumber, mensagemGeral()) },
    { icone: Instagram, rotulo: 'Instagram', valor: tenantConfig.instagram, link: tenantConfig.instagramLink },
  ]
  return (
    <section id="contato" aria-labelledby="contato-titulo" data-sem-zap className="am-folhas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <p className="am-script text-3xl sm:text-4xl">Venha nos visitar</p>
        <h2 id="contato-titulo" className="am-slab mt-1 text-4xl sm:text-5xl">
          Encontre a América
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[rgb(242_239_233/0.16)] bg-[#151517] p-5">
            <div className="flex items-center gap-2">
              <Clock className="am-t-ouro h-5 w-5" aria-hidden="true" />
              <h3 className="am-slab text-xl">Horário</h3>
            </div>
            <dl className="mt-3">
              {tenantConfig.businessHours.map((linha) => (
                <div key={linha.day} className="flex items-center justify-between gap-4 border-b border-[rgb(242_239_233/0.1)] py-2 last:border-0">
                  <dt className="am-t-suave">{linha.day}</dt>
                  <dd className="am-num font-semibold">{linha.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="grid gap-3">
            {itens.map(({ icone: Icone, rotulo, valor, link }) => (
              <li key={rotulo}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[64px] items-center gap-4 rounded-xl border border-[rgb(242_239_233/0.16)] bg-[#151517] p-4 transition-colors hover:border-[#c9a227]"
                >
                  <Icone className="am-t-ouro h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="am-t-suave block text-sm">{rotulo}</span>
                    <span className="font-semibold">{valor}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {tenantConfig.googleMapsEmbedUrl && (
          <div className="mt-6 h-[320px] overflow-hidden rounded-xl border border-[rgb(242_239_233/0.16)]">
            <iframe
              title="Mapa: onde fica a América Barbearia"
              src={tenantConfig.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </section>
  )
}
