"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type Screenshot = {
  src: string
  title: string
  caption: string
  width: number
  height: number
}

// Galeria de prints do sistema (página do produto da demo). Clique para ampliar; Esc ou clique fora fecha.
export function ScreenshotGallery({ shots, phones = false }: { shots: Screenshot[]; phones?: boolean }) {
  const [open, setOpen] = useState<Screenshot | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className={phones ? 'mx-auto grid max-w-md grid-cols-2 gap-4' : 'grid gap-5 sm:grid-cols-2'}>
        {shots.map((shot) => (
          <figure key={shot.src} className="group">
            <button
              type="button"
              onClick={() => setOpen(shot)}
              className="block w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <figcaption className="mt-2.5 px-1">
              <p className="text-sm font-semibold text-foreground">{shot.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{shot.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={open.src}
            alt={`${open.title}: ${open.caption}`}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
