"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

// "Agendar" dourado do cabeçalho: fica escondido enquanto o botão do hero está na tela e desce para o cabeçalho quando o hero
// sai. Assim nunca aparecem dois botões dourados iguais ao mesmo tempo. Sem JavaScript (ou se o botão do hero não existir) o
// botão aparece sempre. Escondido, ele não recebe foco nem é lido por leitor de tela (visibility: hidden no CSS).
export function AgendarCabecalho() {
  const [heroNaTela, setHeroNaTela] = useState(false)

  useEffect(() => {
    const alvo = document.querySelector('[data-hero-agendar]')
    if (!alvo || typeof IntersectionObserver === 'undefined') return
    // -64px no topo: o cabeçalho (64px) cobre o alto da tela, então o botão só conta como "na tela" quando está abaixo dele
    const obs = new IntersectionObserver(([e]) => setHeroNaTela(Boolean(e?.isIntersecting)), { rootMargin: '-64px 0px 0px 0px' })
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [])

  return (
    <Link href="/book" className={`am-btn am-btn--ouro am-btn--sm am-agendar-cab${heroNaTela ? ' is-oculto' : ''}`}>
      Agendar
    </Link>
  )
}
