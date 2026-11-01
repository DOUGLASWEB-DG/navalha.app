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
    <section id="contato" aria-labelledby="contato-titulo" data-sem-zap className="am-sec">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28">
        <span className="am-regua" aria-hidden="true" />
        <h2 id="contato-titulo" className="am-serif text-4xl sm:text-5xl">
          Venha à América
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="am-card">
            <div className="flex items-center gap-3">
              <Clock className="am-ouro h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="am-serif text-2xl">Horário</h3>
            </div>
            <dl>
              {tenantConfig.businessHours.map((linha) => (
                <div key={linha.day} className="flex items-center justify-between gap-4 border-b border-[rgb(237_232_223/0.1)] py-3 last:border-0">
                  <dt className="am-muted">{linha.day}</dt>
                  <dd className="am-num font-semibold">{linha.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="grid gap-4">
            {itens.map(({ icone: Icone, rotulo, valor, link }) => (
              <li key={rotulo}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="am-card !flex-row !items-center !gap-4 !p-5 hover:no-underline"
                >
                  <Icone className="am-ouro h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    <span className="am-muted block text-sm">{rotulo}</span>
                    <span className="font-semibold">{valor}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {tenantConfig.googleMapsEmbedUrl && (
          <div className="mt-6 h-[320px] overflow-hidden border border-[rgb(237_232_223/0.12)]">
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
