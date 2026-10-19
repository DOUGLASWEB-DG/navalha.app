import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { ApiError } from '@/lib/api-error'

// Fotos no disco da VPS, dentro de UPLOADS_DIR (volume persistente). Layout por barbearia:
//   <UPLOADS_DIR>/<barbeariaId>/<services|avatars>/<uuid>.webp
// O banco guarda a URL pública (/media/<chave>); a chave é sempre montada aqui, nunca vinda do cliente.

// Arquivo que prova que UPLOADS_DIR é o volume certo, criado uma vez por servidor (npm run uploads:init).
// Sem ele, a pasta pode ser a do próprio container (volume não montado): gravar ali perderia as fotos no
// próximo deploy, então o envio é recusado com erro claro.
export const UPLOADS_MARKER = '.navalha-uploads'
export const MEDIA_URL_PREFIX = '/media/'
export const UPLOAD_KINDS = ['services', 'avatars'] as const
export type UploadKind = (typeof UPLOAD_KINDS)[number]

const BARBEARIA_ID_RE = /^[a-z0-9][a-z0-9-]{0,62}$/
// Formato exato da chave: nada de "..", barra invertida, maiúsculas ou extensão diferente.
const KEY_RE = /^([a-z0-9][a-z0-9-]{0,62})\/(services|avatars)\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.webp$/

const unavailable = (reason: string) =>
  new ApiError(503, `Armazenamento de fotos indisponível: ${reason}. Nenhum arquivo foi salvo.`)

export function getUploadsDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.UPLOADS_DIR?.trim()
  if (!configured) throw unavailable('UPLOADS_DIR não configurada')
  // Em produção o caminho é o do volume, sempre absoluto; relativo dependeria da pasta de onde o app subiu
  if (env.NODE_ENV === 'production' && !path.isAbsolute(configured)) {
    throw unavailable(`UPLOADS_DIR precisa ser um caminho absoluto em produção (atual: "${configured}")`)
  }
  return path.resolve(configured)
}

// Conferência feita antes de cada gravação: variável, pasta, permissão de escrita e marcador do volume.
export async function assertStorageReady(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const dir = getUploadsDir(env)
  try {
    const stat = await fs.stat(dir)
    if (!stat.isDirectory()) throw unavailable(`${dir} não é uma pasta`)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw unavailable(`a pasta ${dir} não existe`)
  }
  try {
    await fs.access(dir, fsConstants.W_OK)
  } catch {
    throw unavailable(`sem permissão de escrita em ${dir}`)
  }
  try {
    await fs.access(path.join(dir, UPLOADS_MARKER))
  } catch {
    throw unavailable(`volume não montado (falta ${UPLOADS_MARKER} em ${dir}; rode npm run uploads:init no volume)`)
  }
  return dir
}

export function buildObjectKey(barbeariaId: string, kind: UploadKind): string {
  if (!BARBEARIA_ID_RE.test(barbeariaId)) throw new Error(`barbeariaId inválido para caminho de arquivo: "${barbeariaId}"`)
  if (!UPLOAD_KINDS.includes(kind)) throw new Error(`tipo de upload inválido: "${kind}"`)
  return `${barbeariaId}/${kind}/${randomUUID()}.webp`
}

export function parseObjectKey(key: string): { barbeariaId: string; kind: UploadKind; fileName: string } | null {
  const match = KEY_RE.exec(key)
  if (!match) return null
  return { barbeariaId: match[1], kind: match[2] as UploadKind, fileName: `${match[3]}.webp` }
}

export function objectUrl(key: string): string {
  return `${MEDIA_URL_PREFIX}${key}`
}

// Chave a partir da URL guardada no banco; null para qualquer coisa fora do formato (ex.: URL externa).
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url?.startsWith(MEDIA_URL_PREFIX)) return null
  const key = url.slice(MEDIA_URL_PREFIX.length)
  return parseObjectKey(key) ? key : null
}

// Caminho absoluto do arquivo, garantidamente dentro de UPLOADS_DIR.
export function resolveObjectPath(dir: string, key: string): string {
  if (!parseObjectKey(key)) throw new Error(`chave de arquivo inválida: "${key}"`)
  const root = path.resolve(dir)
  const full = path.resolve(root, ...key.split('/'))
  if (!full.startsWith(root + path.sep)) throw new Error(`chave fora da pasta de uploads: "${key}"`)
  return full
}

// Grava em arquivo temporário e renomeia: quem lê nunca vê um arquivo pela metade.
export async function saveObject(key: string, data: Uint8Array, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const dir = await assertStorageReady(env)
  const target = resolveObjectPath(dir, key)
  await fs.mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${randomUUID()}.tmp`
  try {
    await fs.writeFile(temp, data, { flag: 'wx' })
    await fs.rename(temp, target)
  } catch (error) {
    await fs.rm(temp, { force: true })
    throw error
  }
}

// Leitura para a rota pública. Chave inválida ou arquivo ausente: null (a rota responde 404).
export async function readObject(key: string, env: NodeJS.ProcessEnv = process.env): Promise<Buffer | null> {
  if (!parseObjectKey(key)) return null
  let dir: string
  try {
    dir = getUploadsDir(env)
  } catch {
    return null
  }
  try {
    return await fs.readFile(resolveObjectPath(dir, key))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

// Remoção da foto antiga (troca ou remoção). Arquivo que já não existe não é erro.
export async function deleteObject(key: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const dir = await assertStorageReady(env)
  await fs.rm(resolveObjectPath(dir, key), { force: true })
}

// Prepara a pasta do volume: cria se faltar e grava o marcador. Usado por npm run uploads:init.
export async function initUploadsDir(dir: string): Promise<string> {
  const root = path.resolve(dir)
  await fs.mkdir(root, { recursive: true })
  const marker = path.join(root, UPLOADS_MARKER)
  try {
    await fs.access(marker)
  } catch {
    await fs.writeFile(marker, `Pasta de fotos do Navalha.app, inicializada em ${new Date().toISOString()}.\n`)
  }
  return root
}
