// Selo da casa, em linha fina: o nome e a cidade em volta de uma estrela vazada. É a assinatura visual da página (a "americana"
// mora na estrela). Quando o dono mandar o emblema da porta, ele entra no lugar do miolo. O texto em círculo usa textLength para
// fechar a volta sem sobrar nem faltar. O fundo preenchido deixa o selo legível quando fica por cima da foto.
export function Selo({ className, id = 'am-selo-volta' }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Selo da América Barbearia, Ariquemes, Rondônia" className={className}>
      <defs>
        <path id={id} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
      </defs>
      <circle cx="100" cy="100" r="98" fill="#0c0c0d" fillOpacity="0.94" />
      <circle cx="100" cy="100" r="95" fill="none" stroke="#b8975a" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="#b8975a" strokeWidth="1" />
      {/* só o anel de texto pode girar (classe selo-anel, ligada no hero); a estrela e os círculos ficam parados */}
      <g className="selo-anel">
        <text
          fill="#b8975a"
          fontSize="14.5"
          textLength="470"
          lengthAdjust="spacing"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600 }}
        >
          <textPath href={`#${id}`}>AMÉRICA BARBEARIA · ARIQUEMES · RONDÔNIA ·</textPath>
        </text>
      </g>
      {/* estrela de cinco pontas, só o contorno, centrada no miolo */}
      <path
        d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 21l1.7-7L2 9.2l7.1-.6L12 2z"
        fill="none"
        stroke="#b8975a"
        strokeWidth="0.7"
        strokeLinejoin="round"
        transform="translate(70 70) scale(2.5)"
      />
    </svg>
  )
}
