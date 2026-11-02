// Gera as duas imagens do hero da América a partir do que o dono mandou (ficam fora do repositório; o caminho vem por argumento).
// Uso: node scripts/gerar-hero-america.mjs "<foto da placa>" "<recorte do Mateus (PNG com transparência)>" [pasta de saída = public/assets/america]
//  - mateus.webp: o Mateus recortado (sem o fundo), com um brilho dourado embutido em volta ("aura") e a base esmaecendo.
//    O recorte vem de scripts/recortar-fundo.py (modelo de segmentação rodando num container). Aqui só se limpa e se embute o efeito:
//    filtro drop-shadow do CSS sobre uma imagem grande custa pintura, então o brilho nasce dentro do arquivo.
//  - fundo-placa.webp: o MIOLO da placa (as bandeiras ao fundo do letreiro), recortado por um polígono que deixa de fora a parede
//    azul, desfocado dentro do arquivo. Vai por trás do hero, escurecida pelo CSS, como textura.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const [placa, recorte, saida = 'public/assets/america'] = process.argv.slice(2)
if (!placa || !recorte) {
  console.error('Uso: node scripts/gerar-hero-america.mjs "<foto da placa>" "<recorte do Mateus .png>" [pasta de saida]')
  process.exit(2)
}
fs.mkdirSync(saida, { recursive: true })

// ---------- Mateus ----------
// Restos da cadeira do salão que o modelo manteve (atrás do pescoço): apagados por polígonos, em pixels do recorte original (1007x646).
const APAGAR = (process.env.APAGAR || '645,350 800,350 800,440 760,440 720,432 690,420 645,408;320,385 456,385 456,424 400,430 320,446')
  .split(';')
  .map((p) => p.trim())
const meta = await sharp(recorte).metadata()
const W = meta.width
const H = meta.height
const polis = APAGAR.map((p) => `<polygon points="${p}" fill="#000"/>`).join('')
const apagar = Buffer.from(`<svg width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>${polis}</svg>`)

// 1) alfa limpo: apaga os restos, tira o halo claro da borda (encolhe ~1 px) e esmaece a base
const rgba = await sharp(recorte).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const alfaOriginal = await sharp(recorte).extractChannel(3).toBuffer()
const mascaraApagar = await sharp(apagar).greyscale().resize(W, H).raw().toBuffer()
let alfa = await sharp(alfaOriginal)
  .composite([{ input: await sharp(mascaraApagar, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer(), blend: 'multiply' }])
  .blur(1.1)
  .linear(1.35, -34) // contraste do alfa: encolhe a borda e tira o halo
  .toColourspace('b-w') // a composição devolve 3 canais; o alfa precisa de 1 (sem isso a imagem sai listrada)
  .raw()
  .toBuffer()
if (alfa.length !== W * H) {
  console.error(`ABORTADO: alfa com ${alfa.length} bytes, esperava ${W * H} (1 canal)`)
  process.exit(1)
}
// esmaece os últimos 14% da altura (a camisa some na base em vez de ser cortada seco)
const inicioFade = Math.round(H * 0.86)
for (let y = inicioFade; y < H; y++) {
  const f = 1 - (y - inicioFade) / (H - inicioFade)
  for (let x = 0; x < W; x++) alfa[y * W + x] = Math.round(alfa[y * W + x] * f * f)
}
const rgb = Buffer.alloc(W * H * 3)
for (let i = 0; i < W * H; i++) {
  rgb[i * 3] = rgba.data[i * 4]
  rgb[i * 3 + 1] = rgba.data[i * 4 + 1]
  rgb[i * 3 + 2] = rgba.data[i * 4 + 2]
}
const pessoa = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
  .joinChannel(alfa, { raw: { width: W, height: H, channels: 1 } })
  .png()
  .toBuffer()

// 2) contorno de luz dourada: o próprio contorno levemente borrado e pintado de dourado, por baixo da pessoa (o brilho amplo é CSS).
// Tudo com imagens codificadas (PNG de 1 canal), sem montar bytes brutos: o empacotamento manual de canais gerou um retângulo
// quadriculado e listras no arquivo (o alfa ficava 255 longe da pessoa).
const margem = 24
const alfaPng = await sharp(pessoa).ensureAlpha().extractChannel(3).toColourspace('b-w').png().toBuffer()
const auraAlfaBruta = await sharp(alfaPng)
  .extend({ top: margem, bottom: 0, left: margem, right: margem, background: '#000000' })
  .removeAlpha()
  .toColourspace('b-w')
  .blur(5)
  .linear(1.1, 0)
  .png()
  .toBuffer()
// a luz some na base (onde a camisa esmaece), senão aparece uma faixa dourada no pé da imagem
const degrade = Buffer.from(
  `<svg width="${W + 2 * margem}" height="${H + margem}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="#fff"/><stop offset="0.9" stop-color="#000"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
)
const auraAlfa = await sharp(auraAlfaBruta).composite([{ input: degrade, blend: 'multiply' }]).removeAlpha().toColourspace('b-w').png().toBuffer()
const metaAura = await sharp(auraAlfa).metadata()
if (metaAura.channels !== 1) {
  console.error(`ABORTADO: alfa da aura com ${metaAura.channels} canais (esperava 1)`)
  process.exit(1)
}
const ouro = await sharp({
  create: { width: W + 2 * margem, height: H + margem, channels: 3, background: { r: 221, g: 198, b: 109 } },
})
  .joinChannel(auraAlfa)
  .png()
  .toBuffer()

const m = await sharp(ouro)
  .composite([{ input: pessoa, left: margem, top: margem }])
  .webp({ quality: 84, alphaQuality: 92 })
  .toFile(path.join(saida, 'mateus.webp'))
console.log('mateus.webp', m.width + 'x' + m.height, Math.round(m.size / 1024) + ' KB')

// ---------- placa ----------
const metaPlaca = await sharp(placa).metadata()
// Polígono do miolo da placa na foto 640x447 (a placa aparece inclinada; fora dele é parede azul). Coordenadas em pixels da foto original.
const POLIGONO = process.env.POLIGONO || '10,22 112,12 612,214 604,396 10,288'
const mascara = await sharp(
  Buffer.from(`<svg width="${metaPlaca.width}" height="${metaPlaca.height}"><polygon points="${POLIGONO}" fill="#fff"/></svg>`),
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
// O desfoque vai EMBUTIDO no arquivo (e a imagem fica menor): um filtro blur() do CSS sobre uma imagem grande custa pintura
// a cada quadro e atrasou o primeiro desenho da página (medido no Lighthouse). Assim o fundo é só uma imagem leve e já suave.
const f = await sharp(recortada)
  .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
  .resize({ width: 960, kernel: 'lanczos3' })
  .blur(5)
  .webp({ quality: 66, alphaQuality: 80 })
  .toFile(path.join(saida, 'fundo-placa.webp'))
console.log('fundo-placa.webp', f.width + 'x' + f.height, Math.round(f.size / 1024) + ' KB')
