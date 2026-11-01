"use client"

import { useEffect, useRef, useState } from 'react'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'

// WhatsApp flutuante (só no celular): aparece depois da abertura e sai da frente das áreas marcadas com data-sem-zap
// (cursos e contato), que já têm botão próprio e seriam cobertas.
export function ZapFlutuante({ href }: { href: string }) {
  const [rolou, setRolou] = useState(false)
  const [recuado, setRecuado] = useState(false)
  const areas = useRef(new Set<Element>())

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > window.innerHeight * 0.9)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    const vigia = new IntersectionObserver(
      (itens) => {
        for (const i of itens) {
          if (i.isIntersecting) areas.current.add(i.target)
          else areas.current.delete(i.target)
        }
        setRecuado(areas.current.size > 0)
      },
      { threshold: 0.05 },
    )
    document.querySelectorAll('[data-sem-zap]').forEach((a) => vigia.observe(a))
    const lista = areas.current
    return () => {
      window.removeEventListener('scroll', aoRolar)
      vigia.disconnect()
      lista.clear()
    }
  }, [])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={`am-zap${rolou ? ' is-visivel' : ''}${recuado ? ' is-recuado' : ''}`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}
