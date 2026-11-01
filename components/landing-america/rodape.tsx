import Link from 'next/link'

// O único vermelho da página é o filete de poste no alto do rodapé (parado, fino, decorativo).
export function Rodape() {
  return (
    <footer className="am-rodape bg-[#14171a]">
      <div aria-hidden="true" className="am-filete" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
        <p className="am-muted">
          &copy; {new Date().getFullYear()} América Barbearia. Agendamento online por{' '}
          <a href="https://navalhaapp.tech" target="_blank" rel="noopener noreferrer" className="am-link">
            Navalha.app
          </a>
          .
        </p>
        <Link href="/login" className="am-link inline-flex min-h-11 items-center">
          Entrar (equipe)
        </Link>
      </div>
    </footer>
  )
}
