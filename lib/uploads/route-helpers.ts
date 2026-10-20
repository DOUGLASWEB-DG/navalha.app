import { ApiError } from '@/lib/api-error'
import { processImage } from '@/lib/uploads/image'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE } from '@/lib/uploads/limits'
import { buildObjectKey, deleteObject, keyFromUrl, objectUrl, saveObject, type UploadKind } from '@/lib/uploads/storage'

// Partes comuns das rotas de foto (serviço e avatar). A rota decide quem pode e qual registro; aqui fica só o
// recebimento do arquivo e a troca segura no disco.

// Margem para os campos do multipart (nome do campo, boundary) além do arquivo em si.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

// Lê o campo "file" do multipart e devolve a foto já validada e regravada (WebP, sem metadados).
export async function readImageUpload(req: Request): Promise<Buffer> {
  const declaredLength = Number(req.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw new ApiError(413, MAX_UPLOAD_MESSAGE)
  }
  let file: FormDataEntryValue | null
  try {
    file = (await req.formData()).get('file')
  } catch {
    throw new ApiError(400, 'Envio inválido. Escolha a foto novamente.')
  }
  if (!(file instanceof File)) throw new ApiError(400, 'Nenhuma foto foi enviada.')
  return processImage(new Uint8Array(await file.arrayBuffer()))
}

// Ordem segura: grava o arquivo novo, aponta o banco para ele (setUrl) e só então apaga o antigo.
// Se o banco falhar, o arquivo novo é descartado e o antigo continua valendo.
export async function replaceStoredImage(options: {
  barbeariaId: string
  kind: UploadKind
  image: Buffer
  oldUrl: string | null
  setUrl: (url: string) => Promise<void>
  logTag: string
}): Promise<string> {
  const key = buildObjectKey(options.barbeariaId, options.kind)
  await saveObject(key, options.image)
  const url = objectUrl(key)
  try {
    await options.setUrl(url)
  } catch (error) {
    await deleteObject(key).catch(() => undefined)
    throw error
  }
  await removeStoredImage(options.oldUrl, options.logTag)
  return url
}

// Foto que deixou de ser usada: remoção sem importância para quem fez a ação; falha vira log, nunca erro.
export async function removeStoredImage(url: string | null, logTag: string): Promise<void> {
  const key = keyFromUrl(url)
  if (!key) return
  try {
    await deleteObject(key)
  } catch (error) {
    console.error(`[${logTag}] falha ao remover foto antiga`, error)
  }
}
