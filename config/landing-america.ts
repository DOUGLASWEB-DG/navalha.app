// Fotos da página da América (/america). São as que já existiam, convertidas por scripts/otimizar-fotos-america.mjs para
// public/assets/america (WebP, sem recorte). width e height são os reais: a página reserva o espaço certo e a foto aparece inteira.
import type { CursoId } from '@/lib/landing-america'

export interface Foto {
  src: string
  width: number
  height: number
}

export const FOTOS = {
  corte: { src: '/assets/america/corte.webp', width: 900, height: 1200 },
  barba: { src: '/assets/america/barba.webp', width: 900, height: 1200 },
  combo: { src: '/assets/america/combo.webp', width: 900, height: 900 },
  pigmentacao: { src: '/assets/america/pigmentacao.webp', width: 900, height: 1200 },
  luzes: { src: '/assets/america/luzes.webp', width: 776, height: 1038 },
  selagem: { src: '/assets/america/selagem.webp', width: 900, height: 1200 },
  coloracao: { src: '/assets/america/coloracao.webp', width: 900, height: 1250 },
} as const satisfies Record<string, Foto>

export type FotoId = keyof typeof FOTOS

// O serviço do tenantConfig aponta para o arquivo original (/assets/corte.jpeg): daqui sai a foto otimizada.
export const FOTO_DO_ARQUIVO: Record<string, FotoId> = {
  'corte.jpeg': 'corte',
  'barba.jpeg': 'barba',
  'combo.png': 'combo',
  'pigmentacao_fed.jpeg': 'pigmentacao',
  'luzes.jpeg': 'luzes',
  'selagem.jpeg': 'selagem',
}

// Cada foto convida para o curso que ensina aquilo: corte, barba e combo para o Barbeiro Profissional; química para Químicas em Geral.
export const CURSO_DA_FOTO: Record<FotoId, CursoId> = {
  corte: 'barbeiro',
  barba: 'barbeiro',
  combo: 'barbeiro',
  pigmentacao: 'quimicas',
  luzes: 'quimicas',
  selagem: 'quimicas',
  coloracao: 'quimicas',
}

export function fotoDoServico(imagem: string): FotoId | null {
  const arquivo = imagem.split('/').pop() ?? ''
  return FOTO_DO_ARQUIVO[arquivo] ?? null
}
