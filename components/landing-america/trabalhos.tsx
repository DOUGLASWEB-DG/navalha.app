import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { CURSO_DA_FOTO, FOTOS, fotoDoServico, type FotoId } from '@/config/landing-america'
import { CURSOS, linkWhatsapp, mensagemDoCurso } from '@/lib/landing-america'

// Cada card mostra a foto INTEIRA, na proporção original (sem recorte e sem zoom), com o nome do serviço.
// A foto do hero (combo) também está aqui: é o serviço Combo. O toque na foto abre o arquivo em tamanho grande.
// Os dois chamados: agendar, ou aprender a fazer.
//
// SEM PREÇO NEM DURAÇÃO de propósito: o config/tenant.ts é um arquivo estático antigo e divergiu do banco (achado do QA++ de
// 01/11/2026: Pigmentação R$ 45 no config contra R$ 30 no banco, Selagem 60 min contra 120 min, etc.). O valor certo é o que o
// /book mostra, lido do banco. Quando a página passar a ler os serviços do banco, os valores podem voltar aqui.
export function Trabalhos() {
  const cards: { fotoId: FotoId; nome: string; agendar: boolean }[] = tenantConfig.services.flatMap((svc) => {
    const fotoId = fotoDoServico(svc.image)
    return fotoId ? [{ fotoId, nome: svc.name, agendar: true }] : []
  })
  // Foto que já existia nos arquivos da casa, mas fora da lista de serviços: entra só com o convite para aprender
  cards.push({ fotoId: 'coloracao', nome: 'Coloração', agendar: false })

  return (
    <section id="servicos" aria-labelledby="servicos-titulo" className="am-sec">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <span className="am-regua" aria-hidden="true" />
        <h2 id="servicos-titulo" className="am-serif text-4xl sm:text-5xl">
          Serviços da casa
        </h2>
        <p className="am-muted mt-5 max-w-xl text-lg">
          Toque na foto para ver inteira. Valores e horários aparecem na hora de agendar, sempre atualizados. Ou chame para aprender a fazer.
        </p>

        <div className="am-galeria mt-14">
          {cards.map(({ fotoId, nome, agendar }) => {
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
                  <h3 className="am-serif text-2xl">{nome}</h3>
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
