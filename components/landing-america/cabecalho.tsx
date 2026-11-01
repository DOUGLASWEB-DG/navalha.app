import Link from 'next/link'
import { AgendarCabecalho } from './agendar-cabecalho'

// Cabeçalho fixo: o logotipo como letreiro (AMÉRICA em letra pesada com a sombra vermelha fininha, "Barbearia" manuscrito em
// amarelo-dourado cruzando a base das letras, como na placa da fachada), as seções (no computador) e o chamado de agendar.
// Sem estrela: o dono pediu para tirar. "Entrar" fica pequeno, só para a equipe.
export function Cabecalho() {
  return (
    <header className="am-header">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Sem aria-label: o nome acessível é o texto visível (WCAG 2.5.3, "rótulo no nome") mais um complemento só para leitor de tela. */}
        <a href="#inicio" className="am-marca">
          <span className="am-marca__nome">AMÉRICA</span>
          <span className="am-script">Barbearia</span>
          <span className="sr-only">, voltar ao início</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Seções">
          <a href="#cursos" className="am-muted hover:text-[#f1ede0]">Cursos</a>
          <a href="#servicos" className="am-muted hover:text-[#f1ede0]">Serviços</a>
          <a href="#contato" className="am-muted hover:text-[#f1ede0]">Contato</a>
        </nav>
        <div className="flex items-center gap-1">
          <AgendarCabecalho />
          <Link href="/login" className="am-muted inline-flex min-h-11 items-center px-3 text-xs hover:text-[#f1ede0]" title="Entrar no sistema (equipe)">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
