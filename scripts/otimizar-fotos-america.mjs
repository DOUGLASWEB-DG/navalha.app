// Converte as fotos que já existem da América (public/assets) para WebP em public/assets/america, SEM recortar:
// só reduz o tamanho (largura máxima de 900 px, sem ampliar) e troca o formato. Imprime as dimensões finais, que vão para
// config/landing-america.ts (a página usa width e height reais para reservar o espaço certo e a foto aparecer inteira).
// Uso: node scripts/otimizar-fotos-america.mjs
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ORIGEM = 'public/assets'
const DESTINO = 'public/assets/america'
const LARGURA_MAXIMA = 900

const fotos = [
  ['corte.jpeg', 'corte'],
  ['barba.jpeg', 'barba'],
  ['combo.png', 'combo'],
  ['pigmentacao_fed.jpeg', 'pigmentacao'],
  ['luzes.jpeg', 'luzes'],
  ['selagem.jpeg', 'selagem'],
  ['coloracao.jpeg', 'coloracao'],
]

mkdirSync(DESTINO, { recursive: true })

for (const [arquivo, nome] of fotos) {
  const entrada = path.join(ORIGEM, arquivo)
  const saida = path.join(DESTINO, `${nome}.webp`)
  const info = await sharp(entrada)
    .rotate() // respeita a orientação gravada pelo celular
    .resize({ width: LARGURA_MAXIMA, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(saida)
  const antes = (statSync(entrada).size / 1024).toFixed(0)
  const depois = (statSync(saida).size / 1024).toFixed(0)
  console.log(`${nome.padEnd(12)} ${info.width}x${info.height}  ${antes} KB -> ${depois} KB`)
}
