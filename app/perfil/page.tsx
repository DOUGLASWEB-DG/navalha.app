import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Big_Shoulders } from 'next/font/google'
import { Camera, Instagram, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/api'
import { iniciaisDoNome, InstalacaoConfigError, linkWhatsapp, resolvePerfil, type PerfilBarbeiro } from '@/lib/instalacao'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'
import { cn } from '@/lib/utils'
import './perfil.css'

// Página inicial de uma instalação de PROFISSIONAL (INSTALACAO_TIPO=barbeiro, lib/instalacao.ts): apresenta o barbeiro,
// em vez da landing de barbearia. O middleware manda a raiz "/" para cá; nas outras instalações esta página responde 404.
// Nome, WhatsApp, Instagram e cidade vêm do .env da instalação. Foto e serviços vêm do painel do próprio profissional
// (Equipe e Serviços), então ele troca sozinho. Preço não aparece aqui: o cliente vê no agendamento, e não há dois lugares a manter.
// Visual: tinta, aço e giz (sem brilho), o degradê em retícula na foto e a linha de navalha na abertura (perfil.css).
export const dynamic = 'force-dynamic'

const display = Big_Shoulders({ subsets: ['latin'], weight: 'variable', axes: ['opsz'], variable: '--font-display', display: 'swap' })
const titulo = 'font-[family-name:var(--font-display)] font-extrabold tracking-[0.005em]'

const botao = 'p-btn inline-flex min-h-12 items-center justify-center gap-2 px-6 text-base font-semibold'
const botaoPrimario = cn(botao, 'p-btn-primario')
const botaoContorno = cn(botao, 'p-btn-sec')

function carregarPerfil(): PerfilBarbeiro | 'erro' | null {
  try {
    return resolvePerfil()
  } catch (error) {
    // Configuração errada: nunca mostrar a landing (com o contato de outra barbearia). O erro vai para o log de quem opera.
    if (error instanceof InstalacaoConfigError) console.error('[Perfil]', error.message)
    else console.error('[Perfil]', error)
    return 'erro'
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const perfil = carregarPerfil()
  if (!perfil || perfil === 'erro') return { title: 'Agende seu horário' }
  const onde = perfil.cidade ? ` em ${perfil.cidade}` : ''
  const title = `${perfil.nome} | Barbeiro${onde} – Corte e Barba com Hora Marcada`
  const description = `Agende seu corte e barba com ${perfil.nome}${onde}. Escolha serviço e horário em um minuto e receba a confirmação no WhatsApp.`
  return {
    title,
    description,
    openGraph: { type: 'website', locale: 'pt_BR', title, description, siteName: perfil.nome },
  }
}

export default async function PerfilPage() {
  const perfil = carregarPerfil()
  if (!perfil) notFound()

  if (perfil === 'erro') {
    return (
      <main className="perfil grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Página em configuração</h1>
          <p className="mt-2 text-[#8fa1b3]">Volte em instantes.</p>
          <Link href="/book" className={cn(botaoPrimario, 'mt-6')}>
            Agendar um horário
          </Link>
        </div>
      </main>
    )
  }

  const barbearia = await requireTenant()
  const [servicos, equipe] = await Promise.all([
    prisma.service.findMany({
      where: { barbeariaId: barbearia.id, active: true },
      select: { id: true, name: true, description: true, imageUrl: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { barbeariaId: barbearia.id, active: true },
      select: { name: true, role: true, avatarUrl: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Só a foto do proprietário (ADMIN): a de outro usuário ficaria com o nome do profissional na legenda
  const dono = equipe.find((u) => u.role === 'ADMIN' && u.avatarUrl)
  const foto = dono?.avatarUrl ?? null
  const fotosTrabalho = servicos.filter((s) => s.imageUrl).slice(0, 2)
  const cartoes = servicos.slice(0, 6)
  const chamar = linkWhatsapp(perfil.whatsapp, 'Olá! Vim pelo seu site e quero agendar um horário.')
  const numeroTela = formatarTelefone(perfil.whatsapp)
  const primeiroNome = perfil.nome.split(/\s+/)[0]
  const monograma = iniciaisDoNome(perfil.nome)

  return (
    <main className={cn(display.variable, 'perfil min-h-screen antialiased')}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#2f55a0] focus:px-4 focus:py-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <header className="p-header sticky top-0 z-40">
        <div className="px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3">
          <span className="min-w-0">
            <span className={cn(titulo, 'block truncate text-[1.7rem] leading-none')}>{perfil.nome}</span>
            <span className="p-mudo mt-1 block text-[0.8rem]">Barbeiro{perfil.cidade ? ` · ${perfil.cidade}` : ''}</span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Contato">
            <Link href="/book" className={cn(botaoPrimario, 'min-h-11 px-4 text-sm sm:px-5')}>
              Agendar
            </Link>
          </nav>
        </div>
        </div>
        <div aria-hidden className="p-poste" />
      </header>

      <div id="conteudo" tabIndex={-1}>
        <section className="p-hero relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-20">
          <div className="relative mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
            {monograma && (
              <span aria-hidden className={cn(titulo, 'p-monograma')}>
                {monograma}
              </span>
            )}
            <div className="relative">
              <h1 className={cn(titulo, 'text-[clamp(3.4rem,7.6vw,5.4rem)] leading-[0.92]')}>
                <span className="p-corte">
                  Corte e barba
                  <br />
                  com hora marcada
                </span>
              </h1>
              <p className="p-entra p-mudo mt-6 max-w-[34ch] text-lg">
                Escolha o serviço e o horário e agende em um minuto. A confirmação chega no seu WhatsApp.
              </p>
              <div className="p-entra mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/book" className={botaoPrimario}>
                  Agendar meu horário
                </Link>
                <a href={chamar} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
                  <WhatsAppIcon className="h-5 w-5" /> Chamar no WhatsApp
                </a>
              </div>
            </div>

            <div className="p-moldura relative mx-auto w-full max-w-sm">
              <div className="p-foto relative aspect-[4/5] w-full overflow-hidden">
                {foto ? (
                  <img src={foto} alt={`${perfil.nome}, barbeiro`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="p-foto-vazia p-mudo absolute inset-0 grid place-items-center text-center">
                    <div>
                      <Camera className="mx-auto h-8 w-8" aria-hidden />
                      <p className="mt-2 text-sm">Foto do profissional</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="p-legenda p-entra">
                <span aria-hidden className="p-mini-poste" />
                <strong className={cn(titulo, 'text-xl leading-none')}>{primeiroNome}</strong>
                <span className="p-mudo text-sm">Barbeiro{perfil.cidade ? ` em ${perfil.cidade}` : ''}</span>
              </p>
            </div>
          </div>
        </section>

        {cartoes.length > 0 && (
          <section className="px-4 py-16 sm:px-6" aria-labelledby="faco">
            <div className="mx-auto max-w-5xl">
              <h2 id="faco" className={cn(titulo, 'text-[clamp(2.4rem,6vw,3.4rem)] leading-none')}>O que eu faço</h2>
              <p className="p-mudo mt-3 max-w-[56ch]">Atendimento com horário marcado, sem fila e sem espera.</p>
              <ul className="p-placa mt-8">
                {cartoes.map((s) => (
                  <li key={s.id}>
                    <Link href="/book" className="p-linha">
                      <span className="p-linha-topo">
                        <span className={cn(titulo, 'p-linha-nome')}>{s.name}</span>
                        <span aria-hidden className="p-pontilhado" />
                        <span className="p-linha-acao">Agendar</span>
                      </span>
                      {s.description && <span className="p-linha-desc">{s.description}</span>}
                    </Link>
                  </li>
                ))}
              </ul>

              {fotosTrabalho.length > 0 && (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {fotosTrabalho.map((s) => (
                    <li
                      key={s.id}
                      className={cn('p-trabalho relative overflow-hidden', fotosTrabalho.length === 1 ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]')}
                    >
                      <img src={s.imageUrl!} alt={`Trabalho: ${s.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        <section className="p-secao px-4 py-16 sm:px-6" aria-labelledby="quem">
          <div className="mx-auto max-w-5xl">
            <h2 id="quem" className={cn(titulo, 'text-[clamp(2.4rem,6vw,3.4rem)] leading-none')}>Quem corta</h2>
            <p className="p-mudo mt-5 max-w-[60ch] text-lg leading-relaxed">
              {perfil.sobre ?? `Sou o ${primeiroNome}, barbeiro${perfil.cidade ? ` em ${perfil.cidade}` : ''}. Atendo com horário marcado para você não perder tempo.`}
            </p>
            <Link href="/book" className={cn(botaoPrimario, 'mt-8')}>
              Agendar com {primeiroNome}
            </Link>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6" aria-labelledby="como">
          <div className="mx-auto max-w-5xl">
            <h2 id="como" className={cn(titulo, 'text-[clamp(2.4rem,6vw,3.4rem)] leading-none')}>Como agendar</h2>
            <p className="p-mudo mt-3">Sem baixar aplicativo e sem cadastro complicado.</p>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                ['Escolha o serviço', 'Veja os serviços e os valores na hora de agendar.'],
                ['Escolha o horário', `Só aparecem os horários livres de ${primeiroNome}.`],
                ['Receba a confirmação', 'Você recebe a confirmação no WhatsApp.'],
              ].map(([t, d], i) => (
                <li key={t} className="p-passo">
                  <span aria-hidden className={cn(titulo, 'p-num')}>
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="p-mudo mt-1 text-[0.95rem]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 pb-24 pt-6 text-center sm:px-6">
          <h2 className={cn(titulo, 'text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.95]')}>Seu horário está esperando</h2>
          <p className="p-mudo mx-auto mt-4 max-w-[44ch]">Agende agora ou chame {primeiroNome} no WhatsApp.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/book" className={botaoPrimario}>Agendar meu horário</Link>
            <a href={chamar} target="_blank" rel="noopener noreferrer" className={botaoContorno}>{numeroTela}</a>
          </div>
        </section>
      </div>

      <footer className="p-footer px-4 pb-24 pt-7 text-sm sm:px-6 min-[769px]:pb-7">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="p-mudo">
            <strong className="text-[#edf1f4]">{perfil.nome}</strong>
            {perfil.cidade && (
              <span className="inline-flex items-center gap-1 pl-2"><MapPin className="h-3.5 w-3.5" aria-hidden /> {perfil.cidade}</span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {perfil.instagram && (
              <a href={`https://instagram.com/${perfil.instagram}`} target="_blank" rel="noopener noreferrer" className="p-link inline-flex min-h-11 items-center gap-1.5 font-medium">
                <Instagram className="h-4 w-4" aria-hidden /> @{perfil.instagram}
              </a>
            )}
            <a href={chamar} target="_blank" rel="noopener noreferrer" className="p-link inline-flex min-h-11 items-center gap-1.5 font-medium">
              <WhatsAppIcon className="h-4 w-4" /> {numeroTela}
            </a>
          </p>
        </div>
      </footer>

      <a
        href={chamar}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chamar no WhatsApp"
        className="p-zap-flutuante fixed bottom-4 right-4 z-30 h-14 w-14 place-items-center rounded-full text-white"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </main>
  )
}

// 5569992353561 -> (69) 99235-3561
function formatarTelefone(digitos: string): string {
  const local = digitos.slice(2)
  const ddd = local.slice(0, 2)
  const resto = local.slice(2)
  const corte = resto.length - 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}
