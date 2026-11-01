// Gera as duas imagens do hero da América a partir das fotos que o dono mandou (ficam fora do repositório; o caminho vem por argumento).
// Uso: node scripts/gerar-hero-america.mjs "<foto da placa>" "<foto do Mateus>" [pasta de saída = public/assets/america]
//  - mateus.webp: a foto do Mateus inteira, na proporção original (sem recorte).
//  - fundo-placa.webp: o MIOLO da placa (as bandeiras ao fundo do letreiro), recortado por um polígono que deixa de fora a parede
//    azul, com borda suave. Vai por trás do hero, bem escurecida pelo CSS, como textura.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const [placa, mateus, saida = 'public/assets/america'] = process.argv.slice(2)
if (!placa || !mateus) {
  console.error('Uso: node scripts/gerar-hero-america.mjs "<foto da placa>" "<foto do Mateus>" [pasta de saida]')
  process.exit(2)
}
fs.mkdirSync(saida, { recursive: true })

const m = await sharp(mateus).rotate().webp({ quality: 82 }).toFile(path.join(saida, 'mateus.webp'))
console.log('mateus.webp', m.width + 'x' + m.height, Math.round(m.size / 1024) + ' KB')

const meta = await sharp(placa).metadata()
// Polígono do miolo da placa na foto 640x447 (a placa aparece inclinada; fora dele é parede azul). Coordenadas em pixels da foto original.
const POLIGONO = process.env.POLIGONO || '10,22 112,12 612,214 604,396 10,288'
const mascara = await sharp(
  Buffer.from(`<svg width="${meta.width}" height="${meta.height}"><polygon points="${POLIGONO}" fill="#fff"/></svg>`),
)
  .blur(5)
  .png()
  .toBuffer()
const recortada = await sharp(placa)
  .rotate()
  .ensureAlpha()
  .composite([{ input: mascara, blend: 'dest-in' }])
  .png()
  .toBuffer()
const caixa = POLIGONO.split(' ').map((p) => p.split(',').map(Number))
const xs = caixa.map((p) => p[0])
const ys = caixa.map((p) => p[1])
const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
const f = await sharp(recortada)
  .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
  .resize({ width: 1280, kernel: 'lanczos3' })
  .webp({ quality: 78, alphaQuality: 90 })
  .toFile(path.join(saida, 'fundo-placa.webp'))
console.log('fundo-placa.webp', f.width + 'x' + f.height, Math.round(f.size / 1024) + ' KB')
