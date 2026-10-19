// Gera public/assets/icons/*.png a partir dos PNGs originais em public/assets:
// remove o fundo branco (somente o que toca a borda), recorta, centraliza em quadrado 192x192 e comprime.
// Uso: node scripts/optimize-icons.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'public/assets'
const OUT = 'public/assets/icons'
const SIZE = 192
const BG_MIN = 238 // canal minimo para considerar "branco de fundo"
// Icones com disco branco encostado na borda: so o branco puro e fundo, sem suavizar a borda
const HARD_EDGE = new Set(['receitahoje-icon.png', 'receitasamanal-icon.png', 'receitamensal-icon.png', 'totalclientes-icon.png'])
const HARD_BG_MIN = 252

fs.mkdirSync(OUT, { recursive: true })

for (const file of fs.readdirSync(SRC).filter((f) => /-icon\.png$/.test(f) && !f.startsWith('logo'))) {
  const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isBg = new Uint8Array(w * h)
  const hard = HARD_EDGE.has(file)
  const min = hard ? HARD_BG_MIN : BG_MIN
  const near = (i) => data[i * 4] >= min && data[i * 4 + 1] >= min && data[i * 4 + 2] >= min
  const stack = []
  const push = (x, y) => {
    const i = y * w + x
    if (!isBg[i] && near(i)) { isBg[i] = 1; stack.push(i) }
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  while (stack.length) {
    const i = stack.pop(); const x = i % w; const y = (i / w) | 0
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y)
    if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1)
  }
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    if (isBg[i]) { data[o + 3] = 0; continue }
    // pixels de borda: suaviza o halo claro para evitar contorno branco
    const x = i % w; const y = (i / w) | 0
    const touchesBg = (x > 0 && isBg[i - 1]) || (x < w - 1 && isBg[i + 1]) || (y > 0 && isBg[i - w]) || (y < h - 1 && isBg[i + w])
    if (touchesBg && !hard) {
      const m = Math.min(data[o], data[o + 1], data[o + 2])
      if (m > 190) data[o + 3] = Math.max(0, Math.min(255, Math.round(255 * (1 - (m - 190) / 48))))
    }
  }
  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
  await sharp(trimmed)
    .resize(SIZE - 16, SIZE - 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(path.join(OUT, file))
  console.log(file, (fs.statSync(path.join(OUT, file)).size / 1024).toFixed(1) + 'KB')
}
