import Link from 'next/link'

// Cabeçalho fixo: o nome da casa à esquerda, as seções (no computador) e o botão de agendar. "Entrar" fica pequeno, para a equipe.
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(242_239_233/0.14)] bg-[#0b0b0c]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#inicio" className="flex items-baseline gap-2 leading-none" aria-label="América Barbearia, voltar ao início">
          <span className="am-slab text-2xl">AMÉRICA</span>
          <span className="am-script text-xl">Barbearia</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm md:flex" aria-label="Seções">
          <a href="#cursos" className="am-t-suave hover:text-white">Cursos</a>
          <a href="#servicos" className="am-t-suave hover:text-white">Serviços</a>
          <a href="#contato" className="am-t-suave hover:text-white">Contato</a>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/book" className="am-btn am-btn--vermelho am-btn--sm">
            Agendar
          </Link>
          <Link href="/login" className="am-t-suave inline-flex min-h-11 items-center px-3 text-xs hover:text-white" title="Entrar no sistema (equipe)">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
