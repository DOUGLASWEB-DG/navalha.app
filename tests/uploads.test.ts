import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { ApiError } from '../lib/api-error'
import { detectImageType, MAX_UPLOAD_BYTES, processImage } from '../lib/uploads/image'
import {
  assertStorageReady,
  buildObjectKey,
  deleteObject,
  getUploadsDir,
  initUploadsDir,
  keyFromUrl,
  objectUrl,
  parseObjectKey,
  readObject,
  resolveObjectPath,
  saveObject,
  UPLOADS_MARKER,
} from '../lib/uploads/storage'

// Ambiente de teste parcial (o tipo ProcessEnv do Next exige NODE_ENV)
const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv

const UUID = '3f2c1b4a-9d8e-4f7a-8b6c-5d4e3f2a1b0c'

// Imagem sólida de teste gerada na hora (nenhum binário no repositório)
const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } })

async function rejects(promise: Promise<unknown>, status: number, message: RegExp) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof ApiError, `esperava ApiError, veio ${String(error)}`)
    assert.equal(error.status, status)
    assert.match(error.message, message)
    return true
  })
}

// ------------------------------------------------------------------ imagem

test('reconhece o tipo pelo conteúdo, não pelo nome', async () => {
  assert.equal(detectImageType(await solid(10, 10).jpeg().toBuffer()), 'jpeg')
  assert.equal(detectImageType(await solid(10, 10).png().toBuffer()), 'png')
  assert.equal(detectImageType(await solid(10, 10).webp().toBuffer()), 'webp')
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null)
  assert.equal(detectImageType(Buffer.from('isto é um texto renomeado para foto.jpg')), null)
  assert.equal(detectImageType(Buffer.from('GIF89a')), null)
})

test('foto grande vira WebP com o lado maior em 800 px', async () => {
  const out = await processImage(await solid(2000, 1000).jpeg().toBuffer())
  const meta = await sharp(out).metadata()
  assert.equal(meta.format, 'webp')
  assert.equal(meta.width, 800)
  assert.equal(meta.height, 400)
})

test('foto pequena não é ampliada; PNG e WebP também são aceitos', async () => {
  for (const input of [await solid(300, 200).jpeg().toBuffer(), await solid(300, 200).png().toBuffer(), await solid(300, 200).webp().toBuffer()]) {
    const meta = await sharp(await processImage(input)).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', 300, 200])
  }
})

test('metadados são removidos, inclusive localização GPS', async () => {
  const input = await solid(400, 300)
    .withExif({
      IFD0: { Copyright: 'MARCADOR-SECRETO-EXIF', Artist: 'Cliente' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '9/1 54/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '63/1 2/1 0/1' },
    })
    .jpeg()
    .toBuffer()
  const inputMeta = await sharp(input).metadata()
  assert.ok(inputMeta.exif && inputMeta.exif.length > 0, 'a entrada de teste precisa ter EXIF')
  assert.ok(input.includes('MARCADOR-SECRETO-EXIF'))

  const out = await processImage(input)
  const outMeta = await sharp(out).metadata()
  assert.equal(outMeta.exif, undefined)
  assert.equal(outMeta.icc, undefined)
  assert.equal(out.includes('MARCADOR-SECRETO-EXIF'), false)
})

test('a rotação do EXIF é aplicada antes de descartar os metadados', async () => {
  // 400x200 marcada como "girar 90 graus": a foto certa fica em pé, 200x400
  const input = await solid(400, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer()
  const meta = await sharp(await processImage(input)).metadata()
  assert.deepEqual([meta.width, meta.height], [200, 400])
})

test('recusa arquivo vazio, grande demais, SVG e texto disfarçado', async () => {
  await rejects(processImage(Buffer.alloc(0)), 400, /vazio/)
  const tooBig = Buffer.alloc(MAX_UPLOAD_BYTES + 1)
  tooBig.set([0xff, 0xd8, 0xff])
  await rejects(processImage(tooBig), 413, /2 MB/)
  await rejects(processImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), 400, /Formato não suportado/)
  await rejects(processImage(Buffer.from('não sou uma foto, só me chamo foto.jpg')), 400, /Formato não suportado/)
})

test('recusa imagem truncada (ex.: corpo cortado pelo limite do middleware)', async () => {
  const full = await solid(600, 600).jpeg({ quality: 90 }).toBuffer()
  await rejects(processImage(full.subarray(0, Math.floor(full.length * 0.6))), 400, /Não foi possível ler/)
})

test('recusa "bomba de descompressão" acima do teto de pixels', async () => {
  const input = await solid(200, 200).png().toBuffer() // 40.000 px
  await rejects(processImage(input, { maxInputPixels: 10_000 }), 400, /Não foi possível ler/)
})

// ------------------------------------------------------------- armazenamento

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'navalha-uploads-'))
}

test('chave: formato por barbearia, aleatória e validada', () => {
  const key = buildObjectKey('barbearia-america', 'services')
  assert.match(key, /^barbearia-america\/services\/[0-9a-f-]{36}\.webp$/)
  assert.notEqual(key, buildObjectKey('barbearia-america', 'services'))
  assert.deepEqual(parseObjectKey(key)?.barbeariaId, 'barbearia-america')
  assert.throws(() => buildObjectKey('../outra', 'services'))
  assert.throws(() => buildObjectKey('Barbearia', 'avatars'))
  assert.throws(() => buildObjectKey('barbearia-america', 'products' as never))
})

test('chave inválida é recusada (travessia de pasta e variações)', () => {
  const invalid = [
    '', `/barbearia-america/services/${UUID}.webp`, `../x/services/${UUID}.webp`,
    `barbearia-america/services/../../etc/${UUID}.webp`, `barbearia-america\\services\\${UUID}.webp`,
    `%2e%2e/services/${UUID}.webp`, `Barbearia/services/${UUID}.webp`, `barbearia-america/products/${UUID}.webp`,
    `barbearia-america/services/${UUID}.png`, `barbearia-america/services/${UUID}.webp/x`, 'barbearia-america/services/nao-uuid.webp',
  ]
  for (const key of invalid) assert.equal(parseObjectKey(key), null, `deveria recusar: ${key}`)
  assert.equal(keyFromUrl('https://outro-site.com/media/x.webp'), null)
  assert.equal(keyFromUrl('/media/../.env'), null)
  assert.equal(keyFromUrl(null), null)
  const key = `barbearia-america/avatars/${UUID}.webp`
  assert.equal(keyFromUrl(objectUrl(key)), key)
})

test('caminho do arquivo nunca sai de UPLOADS_DIR', () => {
  const root = path.resolve('/srv/uploads')
  const full = resolveObjectPath(root, `barbearia-america/services/${UUID}.webp`)
  assert.ok(full.startsWith(root + path.sep))
  assert.throws(() => resolveObjectPath(root, `../services/${UUID}.webp`))
})

test('sem volume pronto o envio falha com mensagem clara (503) e nada é gravado', async () => {
  const dir = await tempDir()
  try {
    const key = buildObjectKey('barbearia-america', 'services')
    await rejects(assertStorageReady(env({})), 503, /UPLOADS_DIR não configurada/)
    await rejects(assertStorageReady(env({ NODE_ENV: 'production', UPLOADS_DIR: 'data/uploads' })), 503, /caminho absoluto/)
    await rejects(assertStorageReady(env({ UPLOADS_DIR: path.join(dir, 'nao-existe') })), 503, /não existe/)
    // Pasta existe mas sem o marcador: é o caso "volume não montado" dentro do container
    await rejects(saveObject(key, Buffer.from('x'), env({ UPLOADS_DIR: dir })), 503, /volume não montado.*Nenhum arquivo foi salvo/)
    await rejects(deleteObject(key, env({ UPLOADS_DIR: dir })), 503, /volume não montado/)
    assert.deepEqual(await fs.readdir(dir), [])
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test('com o volume inicializado: grava, lê e apaga, sem deixar temporários', async () => {
  const dir = await tempDir()
  try {
    await initUploadsDir(dir)
    const markerBefore = await fs.readFile(path.join(dir, UPLOADS_MARKER), 'utf8')
    await initUploadsDir(dir) // idempotente: não sobrescreve o marcador
    assert.equal(await fs.readFile(path.join(dir, UPLOADS_MARKER), 'utf8'), markerBefore)

    const storageEnv = env({ UPLOADS_DIR: dir })
    assert.equal(getUploadsDir(storageEnv), path.resolve(dir))
    const keyA = buildObjectKey('barbearia-america', 'services')
    const keyB = buildObjectKey('barbearia-teste-b', 'avatars')
    const image = await processImage(await solid(100, 100).png().toBuffer())
    await saveObject(keyA, image, storageEnv)
    await saveObject(keyB, image, storageEnv)

    assert.deepEqual(await readObject(keyA, storageEnv), image)
    assert.deepEqual((await fs.readdir(path.join(dir, 'barbearia-america', 'services'))).filter((f) => f.endsWith('.tmp')), [])
    assert.deepEqual((await fs.readdir(dir)).sort(), [UPLOADS_MARKER, 'barbearia-america', 'barbearia-teste-b'].sort())

    await deleteObject(keyA, storageEnv)
    assert.equal(await readObject(keyA, storageEnv), null)
    await deleteObject(keyA, storageEnv) // apagar de novo não é erro
    assert.ok(await readObject(keyB, storageEnv))
    assert.equal(await readObject(`../${UPLOADS_MARKER}`, storageEnv), null)
    assert.equal(await readObject(keyA, env({})), null)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})
