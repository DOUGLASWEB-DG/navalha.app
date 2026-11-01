import Link from 'next/link'

export function Rodape() {
  return (
    <footer className="am-rodape border-t border-[rgb(242_239_233/0.14)] bg-[#0b0b0c] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm">
        <p className="am-t-suave">
          &copy; {new Date().getFullYear()} América Barbearia. Agendamento online por{' '}
          <a href="https://navalhaapp.tech" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white">
            Navalha.app
          </a>
          .
        </p>
        <Link href="/login" className="am-t-suave inline-flex min-h-11 items-center underline underline-offset-4 hover:text-white">
          Entrar (equipe)
        </Link>
      </div>
    </footer>
  )
}
