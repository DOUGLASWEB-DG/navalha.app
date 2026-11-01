"use client"

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FONTE_PRINTS } from '@/components/produto/doc-parts'

export type DocShot = {
  src: string
  title: string
  caption: string
  width: number
  height: number
}

// Print de uma tela do sistema na documentação, no padrão da ABNT: "Figura N – título" em cima (número automático, em
// produto.css), a imagem, a descrição e a "Fonte:" embaixo. Clique amplia; Esc, clique fora ou o botão fechar volta.
// Escura de propósito: a página do produto é marinho, como a vitrine.
export function DocFigure({ shot, phone = false, className }: { shot: DocShot; phone?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <figure className={cn('mt-6', phone ? 'w-[46%] max-w-[240px]' : 'max-w-3xl', className)}>
        <figcaption className="doc-legenda">{shot.title}</figcaption>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_24px_50px_-24px_rgb(0_0_0/0.7)] transition-colors hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label={`Ampliar: ${shot.title}`}
        >
          <img
            src={shot.src}
            alt={`${shot.title}: ${shot.caption}`}
            width={shot.width}
            height={shot.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </button>
        <p className="mt-2.5 leading-relaxed text-[#b4c2da]">{shot.caption}</p>
        <p className="doc-fonte">Fonte: {FONTE_PRINTS}</p>
      </figure>

      {open && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#010a1b]/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={shot.title}
          onClick={() => setOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563eb] text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={shot.src}
            alt={`${shot.title}: ${shot.caption}`}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
