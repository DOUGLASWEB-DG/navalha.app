"use client"

import { Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

// Abre a janela de impressão do navegador. Com "Salvar como PDF" sai o manual em A4, no padrão da ABNT (app/produto/produto.css).
export function PrintButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className={cn(className)}>
      <Printer className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  )
}
