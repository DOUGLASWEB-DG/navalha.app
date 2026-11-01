import type { Metadata } from 'next'
import { Cormorant_Garamond, Pinyon_Script } from 'next/font/google'
import { tenantConfig } from '@/config/tenant'
import { cn } from '@/lib/utils'
import { linkWhatsapp, mensagemGeral } from '@/lib/landing-america'
import { Cabecalho } from '@/components/landing-america/cabecalho'
import { Hero } from '@/components/landing-america/hero'
import { Faixa } from '@/components/landing-america/faixa'
import { Cursos } from '@/components/landing-america/cursos'
import { QuemEnsina } from '@/components/landing-america/quem-ensina'
import { Trabalhos } from '@/components/landing-america/trabalhos'
import { Contato } from '@/components/landing-america/contato'
import { Rodape } from '@/components/landing-america/rodape'
import { ZapFlutuante } from '@/components/landing-america/zap-flutuante'
import './america.css'

// Página inicial da América (america.navalhaapp.tech). O middleware mostra esta página na raiz só para a barbearia "america"
// (lib/landing-casa.ts); nas outras barbearias /america responde 404. Os dados (endereço, horário, serviços, WhatsApp) vêm do
// config/tenant.ts; as fotos, de config/landing-america.ts. Servidor puro: o único código no navegador é o quiz e o botão do WhatsApp.
// Tipografia: Cormorant Garamond nos títulos (carregada aqui) e a Inter do sistema (do layout) no texto. Sem cursiva.

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// A palavra "Barbearia" do logotipo é manuscrita na placa da fachada; é o único uso de letra manuscrita da página.
const script = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
})

const titulo = `América Barbearia | Cursos de Barbeiro e barbearia em ${tenantConfig.city}`
const descricao = `Barbearia em ${tenantConfig.city} que também ensina: Curso de Barbeiro Profissional, Curso de Aperfeiçoamento e Químicas em Geral, com Mateus Cremas. Agende o seu horário pelo site.`

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  openGraph: { type: 'website', locale: 'pt_BR', title: titulo, description: descricao, siteName: 'América Barbearia' },
}

export default function AmericaPage() {
  return (
    <main data-tema="america" className={cn(display.variable, script.variable, 'america min-h-screen antialiased')}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-[#c9b04a] focus:px-4 focus:py-3 focus:text-[#14171a]"
      >
        Ir para o conteúdo
      </a>
      <Cabecalho />
      <div id="conteudo" tabIndex={-1}>
        <Hero />
        <Faixa />
        <Cursos />
        <QuemEnsina />
        <Trabalhos />
        <Contato />
      </div>
      <Rodape />
      <ZapFlutuante href={linkWhatsapp(tenantConfig.whatsappNumber, mensagemGeral())} />
    </main>
  )
}
