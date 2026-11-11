// Rebuild the runtime icons from originals; run: node scripts/optimize-icons.mjs
// Only near-white pixels connected to the canvas border are background.
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
const catalog = JSON.parse(await fs.readFile('public/assets/icons/catalogo.json', 'utf8'))
for (const category of catalog) for (const icon of category.icons) {
  const { data, info } = await sharp(path.join('public', icon.original)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const mask = new Uint8Array(width * height)
  const queue = new Uint32Array(width * height)
  let head = 0, tail = 0
  const push = (i) => {
    const o = i * 4
    if (!mask[i] && (data[o + 3] === 0 || (data[o] >= 238 && data[o + 1] >= 238 && data[o + 2] >= 238))) {
      mask[i] = 1
      queue[tail++] = i
    }
  }
  for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x) }
  for (let y = 0; y < height; y++) { push(y * width); push(y * width + width - 1) }
  while (head < tail) {
    const i = queue[head++], x = i % width, y = Math.floor(i / width)
    if (x) push(i - 1)
    if (x < width - 1) push(i + 1)
    if (y) push(i - width)
    if (y < height - 1) push(i + width)
  }
  for (let i = 0; i < mask.length; i++) if (mask[i]) data[i * 4 + 3] = 0
  // Discard isolated background speckles smaller than 0.01% of the original canvas.
  // This prevents stray edge pixels from shifting the icon's visual center.
  const visited = new Uint8Array(mask.length)
  for (let start = 0; start < mask.length; start++) {
    if (visited[start] || mask[start] || data[start * 4 + 3] === 0) continue
    head = 0; tail = 0
    const add = (i) => {
      if (!visited[i] && !mask[i] && data[i * 4 + 3] > 0) {
        visited[i] = 1; queue[tail++] = i
      }
    }
    add(start)
    while (head < tail) {
      const i = queue[head++], x = i % width, y = Math.floor(i / width)
      if (x) add(i - 1)
      if (x < width - 1) add(i + 1)
      if (y) add(i - width)
      if (y < height - 1) add(i + width)
    }
    if (tail < width * height * 0.0001) {
      for (let j = 0; j < tail; j++) data[queue[j] * 4 + 3] = 0
    }
  }
  const trimmed = await sharp(data, { raw: { width, height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
  const output = path.join('public', icon.src)
  await fs.mkdir(path.dirname(output), { recursive: true })
  await sharp(trimmed)
    .resize(176, 176, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(output)
  console.log(icon.label)
}
