// Rodapé limpo: só um fio fino no alto e o direito autoral. O filete listrado de branco e vermelho (poste de barbeiro) e o link
// "Entrar (equipe)" saíram a pedido do dono. A equipe continua entrando pelo "Entrar" pequeno do cabeçalho e pelo endereço /login.
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
      </div>
    </footer>
  )
}
