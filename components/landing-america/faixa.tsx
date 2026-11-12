// A frase da porta da barbearia ("BARBA - CABELO - BIGODE", com uma estrela vermelha de cada lado), como uma faixa fina entre o
// início e os cursos. As estrelas vermelhas são o detalhe pequeno de vermelho que a paleta da casa permite.
export function Faixa() {
  return (
    <div className="am-faixa" role="presentation">
      <span className="am-faixa__estrela" aria-hidden="true">
        ★
      </span>
      <p>Barba · Cabelo · Bigode</p>
      <span className="am-faixa__estrela" aria-hidden="true">
        ★
      </span>
    </div>
  )
}
