import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  BarChart3,
  Smartphone,
  Target,
  Users,
  ShieldCheck,
  Package,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScreenshotGallery, type Screenshot } from '@/components/produto/screenshot-gallery'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'

// Página inicial da demo (demo.navalhaapp.tech). O middleware só a serve para a barbearia "demo" (lib/demo-landing.ts);
// nas outras ela responde 404. Os prints são da própria demo, com dados fictícios.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Navalha.app — Demonstração do sistema para barbearias',
  description: 'Agenda online, clientes, equipe, serviços, finanças e metas da sua barbearia em um só lugar. Teste a demonstração.',
}

const desktopShots: Screenshot[] = [
  { src: '/assets/produto/painel-desktop.webp', title: 'Painel do dia', caption: 'Receita de hoje, da semana e do mês, agenda do dia e metas, tudo numa tela.', width: 1600, height: 1000 },
  { src: '/assets/produto/agenda-desktop.webp', title: 'Agendamentos', caption: 'Confirme, conclua ou cancele em um toque, por barbeiro e por dia.', width: 1600, height: 1000 },
  { src: '/assets/produto/clientes-desktop.webp', title: 'Clientes', caption: 'Cadastro e histórico de cada cliente, com contato para chamar no WhatsApp.', width: 1600, height: 1000 },
  { src: '/assets/produto/financas-desktop.webp', title: 'Finanças', caption: 'Caixa, receitas, despesas, lucro e gráficos. Cada atendimento concluído já entra no caixa.', width: 1600, height: 1000 },
  { src: '/assets/produto/servicos-desktop.webp', title: 'Serviços', caption: 'Preço, duração e descrição de cada serviço, com foto.', width: 1600, height: 1000 },
  { src: '/assets/produto/equipe-desktop.webp', title: 'Equipe', caption: 'Cada barbeiro com o seu acesso. O barbeiro vê só a própria agenda.', width: 1600, height: 1000 },
  { src: '/assets/produto/metas-desktop.webp', title: 'Metas', caption: 'Defina a meta do mês e acompanhe o quanto já foi alcançado.', width: 1600, height: 1000 },
  { src: '/assets/produto/produtos-desktop.webp', title: 'Produtos', caption: 'Controle de estoque dos produtos que a barbearia vende.', width: 1600, height: 1000 },
]

const phoneShots: Screenshot[] = [
  { src: '/assets/produto/agendamento-online-celular.webp', title: 'Agendamento online do cliente', caption: 'O cliente escolhe serviço, dia e horário pelo celular, 24 horas por dia.', width: 700, height: 1515 },
  { src: '/assets/produto/painel-celular.webp', title: 'Painel no celular', caption: 'O dono acompanha a barbearia de onde estiver.', width: 700, height: 1515 },
]

const features = [
  { icon: CalendarCheck, title: 'Agenda online 24 horas', text: 'Seu cliente marca sozinho, pelo link da barbearia, sem precisar chamar no WhatsApp.' },
  { icon: BellRing, title: 'Lembretes no WhatsApp', text: 'O sistema avisa o cliente antes do horário e a barbearia quando chega um agendamento novo.' },
  { icon: BarChart3, title: 'Finanças sem planilha', text: 'Cada atendimento concluído vira receita. Você lança as despesas e vê o lucro do mês.' },
  { icon: Users, title: 'Equipe com acesso próprio', text: 'Dono e barbeiros entram com a sua conta. Cada um vê o que precisa ver.' },
  { icon: Target, title: 'Metas e indicadores', text: 'Acompanhe a meta de faturamento e compare a semana com a anterior.' },
  { icon: Package, title: 'Serviços e produtos', text: 'Tabela de serviços com preço e duração, e estoque dos produtos.' },
  { icon: Smartphone, title: 'Feito para o celular', text: 'Funciona no celular do dono, do barbeiro e do cliente, sem instalar nada.' },
  { icon: Globe, title: 'Endereço próprio', text: 'Cada barbearia tem o seu endereço, como suaBarbearia.navalhaapp.tech.' },
  { icon: ShieldCheck, title: 'Dados separados e protegidos', text: 'Os dados de uma barbearia nunca aparecem em outra. Acesso com login e backup diário.' },
]

const steps = [
  { n: '1', title: 'O cliente agenda', text: 'Ele abre o link da barbearia, escolhe o serviço, o dia e o horário.' },
  { n: '2', title: 'A barbearia atende', text: 'O barbeiro vê a agenda do dia, confirma e marca como concluído.' },
  { n: '3', title: 'O caixa se atualiza', text: 'A receita entra sozinha nas finanças, e o painel mostra como o mês está.' },
]

export default function ProdutoPage() {
  // Contato comercial vem do servidor (demo.env), para não gravar número no código nem usar o da América.
  const contactDigits = (process.env.DEMO_CONTACT_WHATSAPP ?? '').replace(/\D/g, '')
  const contactLink = contactDigits
    ? `https://wa.me/${contactDigits}?text=${encodeURIComponent('Olá! Vi a demonstração do Navalha.app e quero saber mais.')}`
    : null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <img src="/assets/logo-wordmark.png" alt="Navalha.app" className="h-8 w-auto object-contain" />
          <Link href="/login">
            <Button size="sm" className="gap-2">
              Entrar na demo <ArrowRight />
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-14 pt-16 text-center">
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary">Demonstração do sistema</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          A agenda, os clientes e o caixa da sua barbearia em um só lugar
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          O Navalha.app troca o caderno e o vai-e-vem de mensagens por um sistema simples. Aqui você vê as telas
          de verdade e pode testar tudo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Testar a demonstração <ArrowRight />
            </Button>
          </Link>
          <a href="#telas">
            <Button size="lg" variant="outline">Ver as telas</Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Para entrar, use o acesso que você recebeu. Os dados desta demonstração são fictícios e são restaurados todos os dias.
        </p>
      </section>

      <section className="border-y border-border/50 bg-muted/20 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-9 text-center">
            <p className="mb-1 text-xs font-semibold tracking-wide text-primary">Como funciona</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Do agendamento ao caixa, sem retrabalho</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="rounded-xl border border-border/60 bg-card p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.n}
                </span>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="telas" className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-9 text-center">
          <p className="mb-1 text-xs font-semibold tracking-wide text-primary">Conheça o sistema</p>
          <h2 className="text-2xl font-bold sm:text-3xl">As telas, como o dono vê</h2>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">Clique em uma imagem para ampliar.</p>
        </div>
        <ScreenshotGallery shots={desktopShots} />

        <div className="mb-8 mt-16 text-center">
          <h3 className="text-xl font-bold">E no celular</h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">O cliente agenda e o dono acompanha, tudo pelo celular.</p>
        </div>
        <ScreenshotGallery shots={phoneShots} phones />
      </section>

      <section className="border-y border-border/50 bg-muted/20 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-9 text-center">
            <p className="mb-1 text-xs font-semibold tracking-wide text-primary">O que você ganha</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Tudo o que a barbearia precisa para trabalhar</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Quer o Navalha.app na sua barbearia?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Teste a demonstração à vontade. Para ter o seu endereço, os seus serviços e a sua equipe, fale com a DrewaWeb.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login">
            <Button size="lg" variant="outline" className="gap-2">
              Entrar na demo <ArrowRight />
            </Button>
          </Link>
          {contactLink && (
            <a href={contactLink} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <WhatsAppIcon className="h-4 w-4" /> Falar com a DrewaWeb
              </Button>
            </a>
          )}
        </div>
      </section>

      <footer className="border-t border-border/50 px-6 py-6 text-center text-xs text-muted-foreground">
        Navalha.app, um produto DrewaWeb. Esta é uma demonstração: os dados são fictícios.
      </footer>
    </main>
  )
}
