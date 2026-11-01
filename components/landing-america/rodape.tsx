import Link from 'next/link'

// Rodapé limpo: só um fio fino no alto. O filete listrado de branco e vermelho (poste de barbeiro) saiu a pedido do dono ("isso é
// passado"); o vermelho da página agora é só a estrela do letreiro.
export function Rodape() {
  return (
    <footer className="am-rodape bg-[#14171a]">
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
