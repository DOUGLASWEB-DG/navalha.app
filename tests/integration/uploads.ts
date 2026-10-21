// Fotos (de serviço e de barbeiro) contra um servidor real: envio, leitura pública, troca, remoção e isolamento
// entre barbearias. A mesma bateria roda para os dois alvos.
//
// Preparo (banco LOCAL; esta suíte e a fixture recusam banco remoto):
//   1. npm run test:fixture
//   2. UPLOADS_DIR=<pasta temporária> npm run uploads:init
//   3. npm run build && UPLOADS_DIR=<mesma pasta> TENANT_ROOT_DOMAIN=navalha.app npx next start -p 3131
//   4. UPLOADS_DIR=<mesma pasta> TEST_PORT=3131 npm run test:uploads
//
// Diferente da suíte de isolamento, esta ALTERA dados (a foto de um serviço e de um barbeiro da barbearia A, e um
// usuário temporário) e restaura o estado ao final: as URLs voltam a null e os arquivos de teste são apagados.
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
const json = (data: unknown) => ({ body: Buffer.from(JSON.stringify(data)), headers: { 'Content-Type': 'application/json' } })
const login = async (host: string, email: string) => (await raw(host, 'POST', '/api/auth/login', json({ email, password: FIXTURE_PASSWORD }))).token

function check(label: string, ok: boolean, detail = '') {
  checks += 1
  if (!ok) failures += 1
  if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' | ' + detail : ''}`)
}
const fileOf = (url: string) => path.join(uploadsDir!, ...url.replace('/media/', '').split('/'))

// Um alvo de foto: qual rota, qual registro de A e de B, onde a URL fica no banco e onde aparece em público
interface Target {
  label: string
  kind: 'services' | 'avatars'
  route: (id: string) => string
  aId: string
  bId: string
  responseField: 'imageUrl' | 'avatarUrl'
  readUrl: (id: string) => Promise<string | null | undefined>
  clearUrl: (id: string) => Promise<unknown>
  publicUrl: (book: any, id: string) => string | null | undefined
}

async function runTarget(t: Target, tokens: { tA?: string; tABarber?: string; tB?: string }, jpeg: Buffer, huge: Buffer, large: [string, Buffer][]) {
  const { tA, tABarber, tB } = tokens
  const upload = (host: string, id: string, token: string | undefined, fileName: string, mime: string, data: Buffer, field?: string) => {
    const m = multipart(fileName, mime, data, field)
    return raw(host, 'POST', t.route(id), { token, body: m.body, headers: m.headers })
  }
  const createdFiles: string[] = []
  if (await t.readUrl(t.aId)) throw new Error(`${t.label}: o registro de teste já tem foto; limpe antes de rodar.`)
  const L = (s: string) => `[${t.label}] ${s}`

  // 1. Autorização
  check(L('sem sessão: 401'), (await upload(A, t.aId, undefined, 'a.jpg', 'image/jpeg', jpeg)).status === 401)
  check(L('barbeiro (não admin): 403'), (await upload(A, t.aId, tABarber, 'a.jpg', 'image/jpeg', jpeg)).status === 403)
  check(L('DELETE sem sessão: 401'), (await raw(A, 'DELETE', t.route(t.aId))).status === 401)

  // 2. Isolamento: registro de outra barbearia é 404, igual a um id que não existe
  const guess = await upload(A, 'cmzzzzzzzzzzzzzzzzzzzzzzz', tA, 'a.jpg', 'image/jpeg', jpeg)
  const crossAtoB = await upload(A, t.bId, tA, 'a.jpg', 'image/jpeg', jpeg)
  const crossBtoA = await upload(B, t.aId, tB, 'a.jpg', 'image/jpeg', jpeg)
  check(L('admin A no registro de B: 404 igual ao id inexistente'), crossAtoB.status === 404 && crossAtoB.text === guess.text, `status=${crossAtoB.status}`)
  check(L('admin B no registro de A: 404'), crossBtoA.status === 404, `status=${crossBtoA.status}`)
  check(L('token de A no host B: 401'), (await upload(B, t.aId, tA, 'a.jpg', 'image/jpeg', jpeg)).status === 401)
  check(L('nada foi gravado nas tentativas negadas'), !(await t.readUrl(t.aId)) && !(await t.readUrl(t.bId)))

  // 3. Entradas inválidas (nada deve ser gravado)
  const bad: [string, Res][] = [
    ['texto com extensão .jpg', await upload(A, t.aId, tA, 'a.jpg', 'image/jpeg', Buffer.from('isto nao e uma imagem'))],
    ['SVG', await upload(A, t.aId, tA, 'a.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))],
    ['campo com outro nome', await upload(A, t.aId, tA, 'a.jpg', 'image/jpeg', jpeg, 'outro')],
    ['corpo que não é multipart', await raw(A, 'POST', t.route(t.aId), { token: tA, ...json({}) })],
  ]
  for (const [label, r] of bad) check(L(`${label}: 400`), r.status === 400, `status=${r.status}`)
  // Acima do limite (15 MB) a rota responde 413 pelo tamanho declarado, antes de ler o corpo. Se ainda aparecer 500,
  // é o Next falhando antes da rota (ver docs/uploads.md): a suíte garante que o arquivo é recusado e nada é gravado.
  const bigRes = await upload(A, t.aId, tA, 'g.png', 'image/png', huge)
  check(L('arquivo acima de 15 MB é recusado (413, ou 500 do framework) sem gravar'), [413, 500].includes(bigRes.status), `status=${bigRes.status}`)
  if (bigRes.status !== 413) console.log(`aviso: [${t.label}] arquivo grande respondeu ${bigRes.status} em vez de 413 (comportamento do Next, ver docs/uploads.md)`)
  check(L('nenhuma foto gravada após entradas inválidas'), !(await t.readUrl(t.aId)))

  // 4. Envio válido
  const ok1 = await upload(A, t.aId, tA, 'foto.jpg', 'image/jpeg', jpeg)
  const url1: string = ok1.json?.[t.responseField] ?? ''
  const urlPattern = new RegExp(`^/media/barbearia-america/${t.kind}/[0-9a-f-]{36}\\.webp$`)
  check(L(`envio válido: 200 com URL /media/<barbearia>/${t.kind}/<uuid>.webp`), ok1.status === 200 && urlPattern.test(url1), `status=${ok1.status} ${ok1.text.slice(0, 120)}`)
  if (url1) createdFiles.push(fileOf(url1))
  check(L('o banco guarda a mesma URL'), (await t.readUrl(t.aId)) === url1)
  check(L('arquivo existe no disco'), Boolean(url1) && fs.existsSync(fileOf(url1)))

  // 5. Leitura pública e conteúdo gravado
  const served = await raw(A, 'GET', url1)
  check(L('GET da foto sem sessão: 200 image/webp'), served.status === 200 && served.headers['content-type'] === 'image/webp', `status=${served.status}`)
  check(L('cabeçalhos: cache imutável e nosniff'), /immutable/.test(String(served.headers['cache-control'])) && served.headers['x-content-type-options'] === 'nosniff')
  const meta = served.status === 200 ? await sharp(served.body).metadata() : null
  check(L('servida é WebP com no máximo 800 px'), meta?.format === 'webp' && Math.max(meta.width ?? 9999, meta.height ?? 9999) <= 800, `${meta?.format} ${meta?.width}x${meta?.height}`)
  check(L('servida sem EXIF/GPS'), meta !== null && !meta.exif && !served.body.includes(Buffer.from('MARCADOR-SECRETO-EXIF')))
  check(L('rotação do EXIF aplicada (1600x1200 com orientação 6 vira retrato)'), meta !== null && (meta.height ?? 0) > (meta.width ?? 0))
  check(L('GET /api/book na A devolve a URL da foto'), t.publicUrl((await raw(A, 'GET', '/api/book')).json, t.aId) === url1)
  check(L('GET /api/book na B não mostra a foto da A'), !(await raw(B, 'GET', '/api/book')).text.includes(url1))

  // 6. Leitura cruzada
  check(L('mesma foto no host B: 404'), (await raw(B, 'GET', url1)).status === 404)
  check(L('mesma foto em host desconhecido: 404'), (await raw('naoexiste.navalha.app', 'GET', url1)).status === 404)

  // 7. Troca: a foto antiga some do disco, a nova responde
  const ok2 = await upload(A, t.aId, tA, 'outra.png', 'image/png', await sharp({ create: { width: 300, height: 300, channels: 3, background: { r: 10, g: 90, b: 200 } } }).png().toBuffer())
  const url2: string = ok2.json?.[t.responseField] ?? ''
  if (url2) createdFiles.push(fileOf(url2))
  check(L('troca: 200 com URL nova'), ok2.status === 200 && url2 !== '' && url2 !== url1)
  check(L('troca: arquivo antigo apagado do disco'), !fs.existsSync(fileOf(url1)))
  check(L('troca: URL antiga passa a 404'), (await raw(A, 'GET', url1)).status === 404)
  check(L('troca: URL nova 200'), (await raw(A, 'GET', url2)).status === 200)

  // 8. Remoção
  check(L('DELETE com admin de B no registro de A: 404 e a foto continua'), (await raw(B, 'DELETE', t.route(t.aId), { token: tB })).status === 404 && fs.existsSync(fileOf(url2)))
  const del = await raw(A, 'DELETE', t.route(t.aId), { token: tA })
  check(L('DELETE com admin de A: 200 e URL null'), del.status === 200 && del.json?.[t.responseField] === null)
  check(L('DELETE: arquivo apagado e banco limpo'), !fs.existsSync(fileOf(url2)) && !(await t.readUrl(t.aId)))
  check(L('DELETE: URL passa a 404'), (await raw(A, 'GET', url2)).status === 404)
  check(L('DELETE repetido: 200 (idempotente)'), (await raw(A, 'DELETE', t.route(t.aId), { token: tA })).status === 200)

  // 9. Fotos grandes VÁLIDAS (o caso de celular): várias seguidas, porque o 500 do Next era intermitente
  for (const [label, data] of large) {
    const statuses: number[] = []
    let lastUrl = ''
    for (let i = 0; i < 3; i++) {
      const res = await upload(A, t.aId, tA, 'grande.jpg', 'image/jpeg', data)
      statuses.push(res.status)
      if (res.json?.[t.responseField]) { lastUrl = res.json[t.responseField]; createdFiles.push(fileOf(lastUrl)) }
    }
    check(L(`${label}: aceita nas 3 tentativas`), statuses.every((s) => s === 200), `status=${statuses.join(',')}`)
    const meta = lastUrl ? await sharp((await raw(A, 'GET', lastUrl)).body).metadata() : null
    check(L(`${label}: guardada como WebP de até 800 px`), meta?.format === 'webp' && Math.max(meta.width ?? 9999, meta.height ?? 9999) <= 800, `${meta?.format} ${meta?.width}x${meta?.height}`)
  }
  await raw(A, 'DELETE', t.route(t.aId), { token: tA })
  check(L('fotos grandes: só a última fica no disco, removida no DELETE'), createdFiles.every((f) => !fs.existsSync(f)))

  // Limpeza do que este alvo criou
  await t.clearUrl(t.aId)
  for (const file of createdFiles) fs.rmSync(file, { force: true })
}

async function main() {
  const tA = await login(A, 'smoke.admin@local.dev')
  const tABarber = await login(A, 'smoke.barber@local.dev')
  const tB = await login(B, 'b.admin@local.dev')
  check('logins de teste (rode a fixture antes)', Boolean(tA && tABarber && tB))

  // Serviço fixo da América criado pela fixture (não usa serviço real, que pode já ter foto)
  const svc = await prisma.service.findUnique({ where: { id: 'smoke-service' }, select: { id: true } })
  if (!svc) throw new Error('Rode a fixture antes (npm run test:fixture): falta o serviço smoke-service.')

  // Foto grande, girada pelo EXIF e com GPS: a saída deve vir sem metadados e com no máximo 800 px
  const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: 200, g: 60, b: 60 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'MARCADOR-SECRETO-EXIF' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '8/1 45/1 30/1', GPSLongitudeRef: 'W', GPSLongitude: '63/1 2/1 0/1' } })
    .withMetadata({ orientation: 6 })
    .toBuffer()
  check('foto de teste tem EXIF antes do envio', Boolean((await sharp(jpeg).metadata()).exif))
  // Ruído não comprime: o PNG fica perto de 3 bytes por pixel
  const huge = await sharp({ create: { width: 2400, height: 2400, channels: 3, background: { r: 128, g: 128, b: 128 }, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png().toBuffer()
  check('arquivo grande de teste passa de 15 MB', huge.length > 15 * 1024 * 1024, `tamanho=${huge.length}`)
  // Válidas: uma de ~10 MB (pesada em bytes) e uma de 50 MP (pesada em pixels, como as de celular de 50 MP)
  const heavy = await sharp({ create: { width: 3600, height: 2800, channels: 3, background: { r: 90, g: 90, b: 90 }, noise: { type: 'gaussian', mean: 128, sigma: 50 } } }).jpeg({ quality: 97 }).toBuffer()
  const megapixels = await sharp({ create: { width: 8160, height: 6120, channels: 3, background: { r: 40, g: 120, b: 200 } } }).jpeg().toBuffer()
  check('foto válida pesada tem entre 8 e 15 MB', heavy.length > 8 * 1024 * 1024 && heavy.length < 15 * 1024 * 1024, `tamanho=${heavy.length}`)
  const large: [string, Buffer][] = [[`foto de ${(heavy.length / 1048576).toFixed(1)} MB`, heavy], ['foto de 50 MP', megapixels]]

  const targets: Target[] = [
    {
      label: 'serviço', kind: 'services', route: (id) => `/api/services/${id}/image`, aId: svc.id, bId: 'b-service', responseField: 'imageUrl',
      readUrl: async (id) => (await prisma.service.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl,
      clearUrl: (id) => prisma.service.update({ where: { id }, data: { imageUrl: null } }),
      publicUrl: (book, id) => book?.services?.find((s: any) => s.id === id)?.imageUrl,
    },
    {
      label: 'avatar', kind: 'avatars', route: (id) => `/api/users/${id}/avatar`, aId: 'smoke-barber', bId: 'b-barber', responseField: 'avatarUrl',
      readUrl: async (id) => (await prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } }))?.avatarUrl,
      clearUrl: (id) => prisma.user.update({ where: { id }, data: { avatarUrl: null } }),
      publicUrl: (book, id) => book?.barbers?.find((b: any) => b.id === id)?.avatarUrl,
    },
  ]
  for (const target of targets) await runTarget(target, { tA, tABarber, tB }, jpeg, huge, large)

  // Caminhos maliciosos na leitura pública (valem para as duas pastas)
  for (const evil of [
    '/media/../.navalha-uploads',
    '/media/barbearia-america/services/..%2F..%2F.navalha-uploads',
    '/media/barbearia-america/services/%2e%2e/%2e%2e/x.webp',
    '/media/barbearia-america/avatars/..%2F..%2F.navalha-uploads',
    '/media/barbearia-america/services/00000000-0000-4000-8000-000000000000.webp',
    '/media/barbearia-america/avatars/00000000-0000-4000-8000-000000000000.webp',
    '/media/',
  ]) {
    const r = await raw(A, 'GET', evil)
    check(`caminho recusado: ${evil}`, r.status === 404 || r.status === 308 || r.status === 400, `status=${r.status}`)
    check(`  e sem conteúdo de arquivo: ${evil}`, !r.text.includes('Pasta de fotos'))
  }

  // Excluir o usuário apaga a foto dele do disco (usuário temporário, criado e excluído aqui)
  const email = `upl.temp.${Date.now()}@local.dev`
  const created = await raw(A, 'POST', '/api/users', { token: tA, ...json({ name: 'UPL Temporario', email, password: 'senha-temporaria-123', role: 'BARBER' }) })
  const tempId: string = created.json?.id ?? ''
  const m = multipart('t.jpg', 'image/jpeg', jpeg)
  const tempUrl: string = (await raw(A, 'POST', `/api/users/${tempId}/avatar`, { token: tA, body: m.body, headers: m.headers })).json?.avatarUrl ?? ''
  check('usuário temporário criado com foto', created.status === 201 && Boolean(tempUrl) && fs.existsSync(fileOf(tempUrl)), `status=${created.status}`)
  const removed = await raw(A, 'DELETE', `/api/users/${tempId}`, { token: tA })
  check('excluir o usuário apaga a foto do disco', removed.status === 200 && !fs.existsSync(fileOf(tempUrl)), `status=${removed.status}`)
  check('excluir o usuário: URL da foto passa a 404', (await raw(A, 'GET', tempUrl)).status === 404)
  if (tempId) await prisma.user.deleteMany({ where: { id: tempId } })
  if (tempUrl) fs.rmSync(fileOf(tempUrl), { force: true })

  console.log(`${checks} verificações`)
  console.log(failures ? `RESULTADO: ${failures} falha(s)` : 'RESULTADO: fotos de serviço e de barbeiro comprovadas (envio, leitura, troca, remoção e isolamento)')
  if (failures) process.exitCode = 1
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
