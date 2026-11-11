import Image from 'next/image'
import { cn } from '@/lib/utils'

// Icones ilustrados do painel (public/assets/icons, 192x192, fundo transparente).
// Decorativo: o texto ao lado ja nomeia a funcao, entao alt vazio.
export function AppIcon({ src, className }: { src: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={192}
      sizes="(max-width: 640px) 32px, 48px"
      height={192}
      draggable={false}
      className={cn('inline-block h-full w-full shrink-0 select-none object-contain', className)}
   />
  )
}
