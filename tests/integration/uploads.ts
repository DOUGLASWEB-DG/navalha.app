// Fotos de serviço contra um servidor real: envio, leitura pública, troca, remoção e isolamento entre barbearias.
//
// Preparo (banco LOCAL; esta suíte e a fixture recusam banco remoto):
//   1. npm run test:fixture
//   2. UPLOADS_DIR=<pasta temporária> npm run uploads:init
//   3. npm run build && UPLOADS_DIR=<mesma pasta> TENANT_ROOT_DOMAIN=navalha.app npx next start -p 3131
//   4. UPLOADS_DIR=<mesma pasta> TEST_PORT=3131 npm run test:uploads
//
// Diferente da suíte de isolamento, esta ALTERA dados (a foto de um serviço da barbearia A) e restaura o
// estado ao final: imageUrl volta a ser null e os arquivos de teste são apagados.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'
import { FIXTURE_PASSWORD } from '../fixtures/constants'
import { assertLocalDatabase } from '../../scripts/local-db-guard'

assertLocalDatabase('test:uploads')

const port = Number(process.env.TEST_PORT ?? 3131)
const uploadsDir = process.env.UPLOADS_DIR
if (!uploadsDir) throw new Error('Defina UPLOADS_DIR com a mesma pasta usada pelo servidor.')
const A = 'america.navalha.app'
const B = 'teste-b.navalha.app'
const prisma = new PrismaClient()
let failures = 0
let checks = 0

interface Res { status: number; body: Buffer; text: string; json: any; headers: http.IncomingHttpHeaders; token?: string }
function raw(host: string, method: string, urlPath: string, opts: { token?: string; headers?: Record<string, string>; body?: Buffer } = {}): Promise<Res> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port, path: urlPath, method,
      headers: {
        Host: host,
        ...(opts.body ? { 'Content-Length': String(opts.body.length) } : {}),
        ...(opts.token ? { Cookie: `barberos_session=${opts.token}` } : {}),
        ...opts.headers,
      },
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks)
        const text = body.toString('utf8')
        let json = null
        try { json = JSON.parse(text) } catch {}
        resolve({ status: res.statusCode ?? 0, body, text, json, headers: res.headers, token: /barberos_session=([^;]+)/.exec((res.headers['set-cookie'] ?? []).join(''))?.[1] })
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

function multipart(fileName: string, mime: string, data: Buffer, field = 'file') {
  const boundary = '----navalha' + Math.random().toString(16).slice(2)
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`)
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return { body: Buffer.concat([head, data, tail]), headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } }
}
const upload = (host: string, serviceId: string, token: string | undefined, fileName: string, mime: string, data: Buffer, field?: string) => {
  const m = multipart(fileName, mime, data, field)
  return raw(host, 'POST', `/api/services/${serviceId}/image`, { token, body: m.body, headers: m.headers })
}
const login = async (host: string, email: string) =>
  (await raw(host, 'POST', '/api/auth/login', {
    body: Buffer.from(JSON.stringify({ email, password: FIXTURE_PASSWORD })),
    headers: { 'Content-Type': 'application/json' },
  })).token

function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' | ' + detail : ''}`)
}
const fileOf = (imageUrl: string) => path.join(uploadsDir, ...imageUrl.replace('/media/', '').split('/'))

async function main() {
  const tA = await login(A, 'smoke.admin@local.dev')
  const tABarber = await login(A, 'smoke.barber@local.dev')
  const tB = await login(B, 'b.admin@local.dev')
  check('logins de teste (rode a fixture antes)', Boolean(tA && tABarber && tB))

  const svc = await prisma.service.findFirst({ where: { barbeariaId: 'barbearia-america', active: true }, select: { id: true, imageUrl: true } })
  if (!svc) throw new Error('A barbearia A precisa de um serviço ativo.')
  if (svc.imageUrl) throw new Error('O serviço de teste já tem foto; limpe antes de rodar.')
  const bSvc = 'b-service'
  const createdFiles: string[] = []

  // Foto grande, girada pelo EXIF e com GPS: a saída deve vir sem metadados e com no máximo 800 px
  const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: 200, g: 60, b: 60 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'MARCADOR-SECRETO-EXIF' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '8/1 45/1 30/1', GPSLongitudeRef: 'W', GPSLongitude: '63/1 2/1 0/1' } })
    .withMetadata({ orientation: 6 })
    .toBuffer()
  check('foto de teste tem EXIF antes do envio', Boolean((await sharp(jpeg).metadata()).exif))

  // 1. Autorização
  check('sem sessão: 401', (await upload(A, svc.id, undefined, 'a.jpg', 'image/jpeg', jpeg)).status === 401)
  check('barbeiro (não admin): 403', (await upload(A, svc.id, tABarber, 'a.jpg', 'image/jpeg', jpeg)).status === 403)
  check('DELETE sem sessão: 401', (await raw(A, 'DELETE', `/api/services/${svc.id}/image`)).status === 401)

  // 2. Isolamento: serviço de outra barbearia é 404, igual a um id que não existe
  const guess = await upload(A, 'cmzzzzzzzzzzzzzzzzzzzzzzz', tA, 'a.jpg', 'image/jpeg', jpeg)
  const crossAtoB = await upload(A, bSvc, tA, 'a.jpg', 'image/jpeg', jpeg)
  const crossBtoA = await upload(B, svc.id, tB, 'a.jpg', 'image/jpeg', jpeg)
  check('admin A no serviço de B: 404 igual ao id inexistente', crossAtoB.status === 404 && crossAtoB.text === guess.text)
  check('admin B no serviço de A: 404', crossBtoA.status === 404)
  check('token de A no host B: 401', (await upload(B, svc.id, tA, 'a.jpg', 'image/jpeg', jpeg)).status === 401)
  check('nada foi gravado nas tentativas negadas', await prisma.service.count({ where: { id: { in: [svc.id, bSvc] }, imageUrl: { not: null } } }) === 0)

  // 3. Entradas inválidas (nada deve ser gravado)
  const bad: [string, Res][] = [
    ['texto com extensão .jpg', await upload(A, svc.id, tA, 'a.jpg', 'image/jpeg', Buffer.from('isto nao e uma imagem'))],
    ['SVG', await upload(A, svc.id, tA, 'a.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))],
    ['campo com outro nome', await upload(A, svc.id, tA, 'a.jpg', 'image/jpeg', jpeg, 'outro')],
    ['corpo que não é multipart', await raw(A, 'POST', `/api/services/${svc.id}/image`, { token: tA, body: Buffer.from('{}'), headers: { 'Content-Type': 'application/json' } })],
  ]
  for (const [label, r] of bad) check(`${label}: 400`, r.status === 400, `status=${r.status}`)
  const huge = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 128, g: 128, b: 128 }, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png().toBuffer()
  // Acima de 10 MB o Next recusa antes da rota (erro 500 do framework); o proxy da VPS barra antes disso (docs/uploads.md)
  check('arquivo acima de 2 MB: 413', huge.length > 2 * 1024 * 1024 && (await upload(A, svc.id, tA, 'g.png', 'image/png', huge)).status === 413, `tamanho=${huge.length}`)
  check('nenhuma foto gravada após entradas inválidas', await prisma.service.count({ where: { id: svc.id, imageUrl: { not: null } } }) === 0)

  // 4. Envio válido
  const ok1 = await upload(A, svc.id, tA, 'foto.jpg', 'image/jpeg', jpeg)
  const url1: string = ok1.json?.imageUrl ?? ''
  check('envio válido: 200 com URL /media/<barbearia>/services/<uuid>.webp', ok1.status === 200 && /^\/media\/barbearia-america\/services\/[0-9a-f-]{36}\.webp$/.test(url1), `status=${ok1.status} ${ok1.text.slice(0, 120)}`)
  if (url1) createdFiles.push(fileOf(url1))
  check('o banco guarda a mesma URL', (await prisma.service.findUnique({ where: { id: svc.id }, select: { imageUrl: true } }))?.imageUrl === url1)
  check('arquivo existe no disco', Boolean(url1) && fs.existsSync(fileOf(url1)))

  // 5. Leitura pública e conteúdo gravado
  const served = await raw(A, 'GET', url1)
  check('GET da foto sem sessão: 200 image/webp', served.status === 200 && served.headers['content-type'] === 'image/webp', `status=${served.status} tipo=${served.headers['content-type']}`)
  check('cabeçalhos: cache imutável e nosniff', /immutable/.test(String(served.headers['cache-control'])) && served.headers['x-content-type-options'] === 'nosniff')
  const meta = served.status === 200 ? await sharp(served.body).metadata() : null
  check('servida é WebP com no máximo 800 px', meta?.format === 'webp' && Math.max(meta.width ?? 9999, meta.height ?? 9999) <= 800, `${meta?.format} ${meta?.width}x${meta?.height}`)
  check('servida sem EXIF/GPS', meta !== null && !meta.exif && !served.body.includes(Buffer.from('MARCADOR-SECRETO-EXIF')))
  check('rotação do EXIF aplicada (1600x1200 com orientação 6 vira retrato)', meta !== null && (meta.height ?? 0) > (meta.width ?? 0), `${meta?.width}x${meta?.height}`)
  const bookA = (await raw(A, 'GET', '/api/book')).json
  check('GET /api/book na A devolve imageUrl do serviço', bookA?.services?.find((s: any) => s.id === svc.id)?.imageUrl === url1)

  // 6. Leitura cruzada e caminhos maliciosos
  check('mesma foto no host B: 404', (await raw(B, 'GET', url1)).status === 404)
  check('mesma foto em host desconhecido: 404', (await raw('naoexiste.navalha.app', 'GET', url1)).status === 404)
  for (const evil of [
    '/media/../.navalha-uploads',
    '/media/barbearia-america/services/..%2F..%2F.navalha-uploads',
    '/media/barbearia-america/services/%2e%2e/%2e%2e/x.webp',
    `/media/barbearia-america/services/${path.basename(url1).toUpperCase()}`,
    '/media/barbearia-america/services/00000000-0000-4000-8000-000000000000.webp',
    '/media/barbearia-america/avatars/00000000-0000-4000-8000-000000000000.webp',
    '/media/',
  ]) {
    const r = await raw(A, 'GET', evil)
    check(`caminho recusado: ${evil}`, r.status === 404 || r.status === 308 || r.status === 400, `status=${r.status}`)
    check(`  e sem conteúdo de arquivo: ${evil}`, !r.text.includes('Pasta de fotos'))
  }

  // 7. Troca: a foto antiga some do disco, a nova responde
  const ok2 = await upload(A, svc.id, tA, 'outra.png', 'image/png', await sharp({ create: { width: 300, height: 300, channels: 3, background: { r: 10, g: 90, b: 200 } } }).png().toBuffer())
  const url2: string = ok2.json?.imageUrl ?? ''
  if (url2) createdFiles.push(fileOf(url2))
  check('troca: 200 com URL nova', ok2.status === 200 && url2 !== '' && url2 !== url1)
  check('troca: arquivo antigo apagado do disco', !fs.existsSync(fileOf(url1)))
  check('troca: URL antiga passa a 404', (await raw(A, 'GET', url1)).status === 404)
  check('troca: URL nova 200', (await raw(A, 'GET', url2)).status === 200)

  // 8. Remoção
  check('DELETE com admin de B no serviço de A: 404 e a foto continua', (await raw(B, 'DELETE', `/api/services/${svc.id}/image`, { token: tB })).status === 404 && fs.existsSync(fileOf(url2)))
  const del = await raw(A, 'DELETE', `/api/services/${svc.id}/image`, { token: tA })
  check('DELETE com admin de A: 200 e imageUrl null', del.status === 200 && del.json?.imageUrl === null)
  check('DELETE: arquivo apagado e banco limpo', !fs.existsSync(fileOf(url2)) && (await prisma.service.findUnique({ where: { id: svc.id }, select: { imageUrl: true } }))?.imageUrl === null)
  check('DELETE: URL passa a 404', (await raw(A, 'GET', url2)).status === 404)
  check('DELETE repetido: 200 (idempotente)', (await raw(A, 'DELETE', `/api/services/${svc.id}/image`, { token: tA })).status === 200)

  // 9. Limpeza do que o teste criou
  await prisma.service.update({ where: { id: svc.id }, data: { imageUrl: null } })
  for (const file of createdFiles) fs.rmSync(file, { force: true })

  console.log(`${checks} verificações`)
  console.log(failures ? `RESULTADO: ${failures} falha(s)` : 'RESULTADO: fotos de serviço comprovadas (envio, leitura, troca, remoção e isolamento)')
  if (failures) process.exitCode = 1
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
