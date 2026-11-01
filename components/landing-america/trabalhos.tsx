import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { CURSO_DA_FOTO, FOTOS, fotoDoServico, type FotoId } from '@/config/landing-america'
import { CURSOS, linkWhatsapp, mensagemDoCurso } from '@/lib/landing-america'

const preco = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(valor) ? 0 : 2 })}`

// Cada card mostra a foto INTEIRA, na proporção original (sem recorte e sem zoom), com o nome, a duração e o preço do serviço.
// O toque na foto abre o arquivo em tamanho grande (dá para dar zoom com os dedos). Os dois botões: agendar, ou aprender a fazer.
export function Trabalhos() {
  const cards: { fotoId: FotoId; nome: string; detalhe: string | null; agendar: boolean }[] = tenantConfig.services.flatMap((svc) => {
    const fotoId = fotoDoServico(svc.image)
    return fotoId ? [{ fotoId, nome: svc.name, detalhe: `${svc.duration} · ${preco(svc.price)}`, agendar: true }] : []
  })
  // Foto de coloração que já existia nos arquivos da casa, mas fora da lista de serviços: entra só com o convite para aprender
  cards.push({ fotoId: 'coloracao', nome: 'Coloração', detalhe: null, agendar: false })

  return (
    <section id="servicos" aria-labelledby="servicos-titulo" className="am-claro">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <p className="am-script text-3xl text-[#9d1237] sm:text-4xl">Nosso trabalho</p>
        <h2 id="servicos-titulo" className="am-slab mt-1 text-4xl sm:text-5xl">
          Serviços da casa
        </h2>
        <p className="am-suave mt-4 max-w-xl text-lg">Toque na foto para ver inteira. Agende pelo site ou chame para aprender a fazer.</p>

        <div className="am-galeria mt-10">
          {cards.map(({ fotoId, nome, detalhe, agendar }) => {
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
                <div className="mt-3">
                  <h3 className="am-slab text-xl">{nome}</h3>
                  {detalhe && <p className="am-suave am-num text-sm">{detalhe}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {agendar && (
                      <Link href="/book" className="am-btn am-btn--vermelho am-btn--sm">
                        Agendar
                      </Link>
                    )}
                    <a
                      href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemDoCurso(curso))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-[#9d1237] underline underline-offset-4 hover:text-[#6e0c27]"
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
