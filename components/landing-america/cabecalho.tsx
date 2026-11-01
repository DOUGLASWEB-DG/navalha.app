import Link from 'next/link'

// Cabeçalho fixo e discreto: o nome da casa com a estrela à esquerda, as seções (no computador) e o chamado de agendar.
// "Entrar" fica pequeno, só para a equipe.
export function Cabecalho() {
  return (
    <header className="am-header">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Sem aria-label: o nome acessível é o texto visível (WCAG 2.5.3, "rótulo no nome") mais um complemento só para leitor de tela. */}
        <a href="#inicio" className="am-marca">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="am-marca__estrela" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 21l1.7-7L2 9.2l7.1-.6L12 2z" />
          </svg>
          <span className="am-serif am-marca__nome">AMÉRICA</span>{' '}
          <span className="am-muted hidden text-xs sm:inline">Barbearia</span>
          <span className="sr-only">, voltar ao início</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Seções">
          <a href="#cursos" className="am-muted hover:text-[#ede8df]">Cursos</a>
          <a href="#servicos" className="am-muted hover:text-[#ede8df]">Serviços</a>
          <a href="#contato" className="am-muted hover:text-[#ede8df]">Contato</a>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/book" className="am-btn am-btn--ouro am-btn--sm">
            Agendar
          </Link>
          <Link href="/login" className="am-muted inline-flex min-h-11 items-center px-3 text-xs hover:text-[#ede8df]" title="Entrar no sistema (equipe)">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
