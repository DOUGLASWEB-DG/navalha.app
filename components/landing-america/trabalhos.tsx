import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { CURSO_DA_FOTO, FOTOS, fotoDoServico, type FotoId } from '@/config/landing-america'
import { CURSOS, linkWhatsapp, mensagemDoCurso } from '@/lib/landing-america'

const preco = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(valor) ? 0 : 2 })}`

// Cada card mostra a foto INTEIRA, na proporção original (sem recorte e sem zoom), com o nome, a duração e o preço do serviço.
// A foto do hero (combo) também está aqui: é o serviço Combo. O toque na foto abre o arquivo em tamanho grande.
// Os dois chamados: agendar, ou aprender a fazer.
export function Trabalhos() {
  const cards: { fotoId: FotoId; nome: string; duracao: string | null; valor: string | null; agendar: boolean }[] = tenantConfig.services.flatMap((svc) => {
    const fotoId = fotoDoServico(svc.image)
    return fotoId ? [{ fotoId, nome: svc.name, duracao: svc.duration, valor: preco(svc.price), agendar: true }] : []
  })
  // Foto que já existia nos arquivos da casa, mas fora da lista de serviços: entra só com o convite para aprender
  cards.push({ fotoId: 'coloracao', nome: 'Coloração', duracao: null, valor: null, agendar: false })

  return (
    <section id="servicos" aria-labelledby="servicos-titulo" className="am-sec">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <span className="am-regua" aria-hidden="true" />
        <h2 id="servicos-titulo" className="am-serif text-4xl sm:text-5xl">
          Serviços da casa
        </h2>
        <p className="am-muted mt-5 max-w-xl text-lg">Toque na foto para ver inteira. Agende pelo site ou chame para aprender a fazer.</p>

        <div className="am-galeria mt-14">
          {cards.map(({ fotoId, nome, duracao, valor, agendar }) => {
            const foto = FOTOS[fotoId]
            const curso = CURSOS[CURSO_DA_FOTO[fotoId]]
            return (
              <article key={fotoId}>
                <a
                  href={foto.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="am-foto"
                  aria-label={`Abrir a foto de ${nome} em tamanho grande`}
                >
                  <img src={foto.src} width={foto.width} height={foto.height} alt={`Trabalho: ${nome}`} loading="lazy" decoding="async" />
                </a>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="am-serif text-2xl">{nome}</h3>
                    {valor && <p className="am-ouro am-num font-semibold">{valor}</p>}
                  </div>
                  {duracao && <p className="am-muted am-num text-sm">{duracao}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                    {agendar && (
                      <Link href="/book" className="am-btn am-btn--linha am-btn--sm">
                        Agendar
                      </Link>
                    )}
                    <a
                      href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemDoCurso(curso))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="am-link inline-flex min-h-11 items-center text-sm"
                    >
                      Quero aprender a fazer
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
