// Selo da casa: o nome e as duas raízes em volta de uma estrela. É um selo próprio, desenhado aqui; quando o dono mandar o
// emblema da porta, ele entra no lugar do miolo. O texto em círculo usa textLength para fechar a volta sem sobrar nem faltar.
export function Selo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Selo da América Barbearia: técnica americana, raiz brasileira"
      className={className}
    >
      <defs>
        <path id="am-selo-volta" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--a-dourado)" strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="var(--a-dourado)" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="56" fill="var(--a-azul-fundo)" stroke="var(--a-dourado)" strokeWidth="2" />
      <text fill="var(--a-dourado)" fontSize="13" textLength="455" lengthAdjust="spacing" style={{ fontFamily: 'var(--font-slab), Georgia, serif' }}>
        <textPath href="#am-selo-volta">AMÉRICA BARBEARIA ★ TÉCNICA AMERICANA ★ RAIZ BRASILEIRA ★</textPath>
      </text>
      {/* estrela de cinco pontas, 48 px, centrada no miolo (a mesma da faixa do hero) */}
      <path
        d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 21l1.7-7L2 9.2l7.1-.6L12 2z"
        fill="var(--a-dourado)"
        transform="translate(76 76) scale(2)"
      />
    </svg>
  )
}
