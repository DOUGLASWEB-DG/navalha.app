import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import { Camera, Instagram, MapPin, Scissors } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/api'
import { InstalacaoConfigError, linkWhatsapp, resolvePerfil, type PerfilBarbeiro } from '@/lib/instalacao'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'
import { cn } from '@/lib/utils'
import './perfil.css'

// Página inicial de uma instalação de PROFISSIONAL (INSTALACAO_TIPO=barbeiro, lib/instalacao.ts): apresenta o barbeiro,
// em vez da landing de barbearia. O middleware manda a raiz "/" para cá; nas outras instalações esta página responde 404.
// Nome, WhatsApp, Instagram e cidade vêm do .env da instalação. Foto e serviços vêm do painel do próprio profissional
// (Equipe e Serviços), então ele troca sozinho. Preço não aparece aqui: o cliente vê no agendamento, e não há dois lugares a manter.
export const dynamic = 'force-dynamic'

const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' })
const titulo = 'font-[family-name:var(--font-display)] font-bold uppercase tracking-normal'

const botao =
  'p-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold'
const botaoPrimario = cn(botao, 'p-btn-primario text-white')
const botaoContorno = cn(botao, 'p-btn-sec text-white')

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
  return {
    title: `${perfil.nome} · Barbeiro${onde}`,
    description: `Agende seu horário com ${perfil.nome}${onde ? `, barbeiro${onde}` : ''}. Escolha o serviço e o horário online e receba a confirmação no WhatsApp.`,
  }
}

export default async function PerfilPage() {
  const perfil = carregarPerfil()
  if (!perfil) notFound()

  if (perfil === 'erro') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#010a1b] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Página em configuração</h1>
          <p className="mt-2 text-[#9fb0cc]">Volte em instantes.</p>
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

  return (
    <main className={cn(display.variable, 'perfil min-h-screen bg-[#010a1b] text-white antialiased')}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#2563eb] focus:px-4 focus:py-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <header className="p-header sticky top-0 z-40 bg-[#010a1b]/90 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3">
          <span className="min-w-0">
            <span className={cn(titulo, 'block truncate text-[1.45rem] leading-none')}>{perfil.nome}</span>
            <span className="mt-1 block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-blue-300">
              Barbeiro{perfil.cidade ? ` · ${perfil.cidade}` : ''}
            </span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Contato">
            <Link href="/book" className={cn(botaoPrimario, 'min-h-11 px-4 text-sm sm:px-5')}>
              Agendar
            </Link>
          </nav>
        </div>
      </header>

      <div id="conteudo" tabIndex={-1}>
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#2563eb]/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="p-selo inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
                Barbeiro{perfil.cidade ? ` em ${perfil.cidade}` : ''}
              </span>
              <h1 className={cn(titulo, 'mt-5 text-[clamp(3rem,9vw,5.6rem)] leading-[0.92]')}>
                Corte e barba
                <br />
                com <span className="text-[#3b82f6]">hora marcada</span>
              </h1>
              <p className="mt-5 max-w-[34ch] text-lg text-[#9fb0cc]">
                Escolha o serviço e o horário e agende em um minuto. A confirmação chega no seu WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/book" className={botaoPrimario}>
                  Agendar meu horário
                </Link>
                <a href={chamar} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
                  <WhatsAppIcon className="h-5 w-5" /> Chamar no WhatsApp
                </a>
              </div>
            </div>

            <div className="p-foto relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden bg-[#08142b]">
              {foto ? (
                <img src={foto} alt={`${perfil.nome}, barbeiro`} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="p-foto-vazia absolute inset-0 grid place-items-center text-center text-[#9fb0cc]">
                  <div>
                    <Camera className="mx-auto h-8 w-8" aria-hidden />
                    <p className="mt-2 text-sm">Foto do profissional</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#010a1b]/90 to-transparent" aria-hidden />
              <div className="p-vidro absolute bottom-4 left-4 px-3.5 py-2">
                <strong className={cn(titulo, 'block text-xl leading-none')}>{primeiroNome}</strong>
                <span className="text-sm text-[#9fb0cc]">Barbeiro</span>
              </div>
            </div>
          </div>
        </section>

        {cartoes.length > 0 && (
          <section className="px-4 py-14 sm:px-6" aria-labelledby="faco">
            <div className="mx-auto max-w-5xl">
              <h2 id="faco" className={cn(titulo, 'text-4xl')}>O que eu faço</h2>
              <p className="mt-2 max-w-[56ch] text-[#9fb0cc]">Atendimento com horário marcado, sem fila e sem espera.</p>
              <ul className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {cartoes.map((s) => (
                  <li key={s.id} className="p-card rounded-2xl bg-[#08142b] p-5">
                    <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                      <Scissors className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className={cn(titulo, 'text-2xl leading-tight')}>{s.name}</h3>
                    {s.description && <p className="mt-1.5 text-[0.95rem] text-[#9fb0cc]">{s.description}</p>}
                  </li>
                ))}
              </ul>

              {fotosTrabalho.length > 0 && (
                <ul className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                  {fotosTrabalho.map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        'p-card relative overflow-hidden rounded-2xl bg-[#08142b]',
                        fotosTrabalho.length === 1 ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]',
                      )}
                    >
                      <img src={s.imageUrl!} alt={`Trabalho: ${s.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        <section className="p-secao bg-[#08142b] px-4 py-14 sm:px-6" aria-labelledby="quem">
          <div className="mx-auto max-w-3xl">
            <h2 id="quem" className={cn(titulo, 'text-4xl')}>Quem corta</h2>
            <p className="mt-4 text-lg leading-relaxed text-[#9fb0cc]">
              {perfil.sobre ?? `Sou o ${primeiroNome}, barbeiro${perfil.cidade ? ` em ${perfil.cidade}` : ''}. Atendo com horário marcado para você não perder tempo.`}
            </p>
            <Link href="/book" className={cn(botaoPrimario, 'mt-7')}>
              Agendar com {primeiroNome}
            </Link>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6" aria-labelledby="como">
          <div className="mx-auto max-w-5xl">
            <h2 id="como" className={cn(titulo, 'text-4xl')}>Como agendar</h2>
            <p className="mt-2 text-[#9fb0cc]">Sem baixar aplicativo e sem cadastro complicado.</p>
            <ol className="mt-7 grid gap-3.5 md:grid-cols-3">
              {[
                ['Escolha o serviço', 'Veja os serviços e os valores na hora de agendar.'],
                ['Escolha o horário', `Só aparecem os horários livres de ${primeiroNome}.`],
                ['Receba a confirmação', 'Você recebe a confirmação no WhatsApp.'],
              ].map(([t, d], i) => (
                <li key={t} className="p-card rounded-2xl bg-[#08142b] p-5">
                  <span className={cn(titulo, 'mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#2563eb] text-xl')}>{i + 1}</span>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-[0.95rem] text-[#9fb0cc]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 pb-20 pt-6 text-center sm:px-6">
          <h2 className={cn(titulo, 'text-[clamp(2.4rem,6vw,4rem)] leading-none')}>Seu horário está esperando</h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-[#9fb0cc]">Agende agora ou chame {primeiroNome} no WhatsApp.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/book" className={botaoPrimario}>Agendar meu horário</Link>
            <a href={chamar} target="_blank" rel="noopener noreferrer" className={botaoContorno}>{numeroTela}</a>
          </div>
        </section>
      </div>

      <footer className="p-footer px-4 pb-24 pt-7 text-sm text-[#9fb0cc] sm:px-6 min-[769px]:pb-7">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-white">{perfil.nome}</strong>
            {perfil.cidade && (
              <span className="inline-flex items-center gap-1 pl-2"><MapPin className="h-3.5 w-3.5" aria-hidden /> {perfil.cidade}</span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {perfil.instagram && (
              <a href={`https://instagram.com/${perfil.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-white hover:text-blue-300">
                <Instagram className="h-4 w-4" aria-hidden /> @{perfil.instagram}
              </a>
            )}
            <a href={chamar} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-white hover:text-blue-300">
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

// 5569992353661 -> (69) 99235-3661
function formatarTelefone(digitos: string): string {
  const local = digitos.slice(2)
  const ddd = local.slice(0, 2)
  const resto = local.slice(2)
  const corte = resto.length - 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}
