import sharp from 'sharp'
import { ApiError } from '@/lib/api-error'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE } from '@/lib/uploads/limits'

// Fotos de serviço e de barbeiro: entrada até MAX_UPLOAD_BYTES (lib/uploads/limits.ts); saída WebP com o lado
// maior em até 800 px.
export { MAX_UPLOAD_BYTES }
export const MAX_IMAGE_SIDE = 800
// Teto de pixels decodificados (largura x altura). Bloqueia "bombas de descompressão": um arquivo pequeno
// que declara dimensões enormes e esgotaria a memória ao ser aberto. 60 MP cobre celulares de 48/50 MP;
// decodificar no teto usa cerca de 250 MB de memória.
export const MAX_INPUT_PIXELS = 60_000_000

export type ImageType = 'jpeg' | 'png' | 'webp'

// Tipo pelo conteúdo (assinatura binária), nunca pelo nome ou pelo Content-Type enviado pelo cliente.
// SVG fica de fora de propósito: é texto que pode carregar script.
export function detectImageType(data: Uint8Array): ImageType | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpeg'
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (data.length >= 8 && png.every((byte, i) => data[i] === byte)) return 'png'
  const ascii = (start: number, end: number) => String.fromCharCode(...data.subarray(start, end))
  if (data.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

// Valida e regrava a imagem. Regravar (em vez de salvar o original) garante que o arquivo servido é uma
// imagem limpa: sem metadados (EXIF, localização GPS), com a rotação aplicada e no tamanho padrão.
export async function processImage(input: Uint8Array, options: { maxInputPixels?: number } = {}): Promise<Buffer> {
  if (input.length === 0) throw new ApiError(400, 'Arquivo vazio.')
  if (input.length > MAX_UPLOAD_BYTES) throw new ApiError(413, MAX_UPLOAD_MESSAGE)
  if (!detectImageType(input)) throw new ApiError(400, 'Formato não suportado. Envie uma foto JPEG, PNG ou WebP.')

  try {
    return await sharp(input, {
      limitInputPixels: options.maxInputPixels ?? MAX_INPUT_PIXELS,
      // Arquivo truncado ou corrompido é recusado, em vez de virar uma imagem parcial
      failOn: 'warning',
    })
      .rotate() // aplica a orientação do EXIF antes de descartá-lo
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer() // sem withMetadata/keepMetadata: o sharp não copia metadados para a saída
  } catch {
    throw new ApiError(400, 'Não foi possível ler a imagem. Envie outro arquivo.')
  }
}
