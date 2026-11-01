// Rótulo de seção no estilo do letreiro da porta: estrela vermelha, caixa-alta condensada e um fio dourado.
// Diz de que lado da casa a seção é, espelhando os dois chamados do início: "Quero cortar" (serviços) e "Quero aprender" (cursos).
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="am-kicker">
      <span className="am-kicker__estrela" aria-hidden="true">
        ★
      </span>
      <span>{children}</span>
    </p>
  )
}
