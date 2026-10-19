import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { MAX_UPLOAD_BYTES, processImage } from '@/lib/uploads/image'
import { buildObjectKey, deleteObject, keyFromUrl, objectUrl, saveObject } from '@/lib/uploads/storage'

// Margem para os campos do multipart (nome do campo, boundary) além do arquivo em si.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

// Foto antiga: remoção sem importância para quem enviou; falha vira log, nunca erro da requisição.
async function removeOldObject(imageUrl: string | null) {
  const key = keyFromUrl(imageUrl)
  if (!key) return
  try {
    await deleteObject(key)
  } catch (error) {
    console.error('[Services image] falha ao remover foto antiga', error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params

    // Serviço de outra barbearia ou inexistente: 404, antes de ler o corpo
    const service = await prisma.service.findFirst({
      where: { id, barbeariaId: barbearia.id },
      select: { id: true, imageUrl: true },
    })
    if (!service) throw notFound()

    const declaredLength = Number(req.headers.get('content-length') ?? 0)
    if (declaredLength > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
      throw new ApiError(413, 'A foto pode ter no máximo 2 MB.')
    }

    let file: FormDataEntryValue | null
    try {
      file = (await req.formData()).get('file')
    } catch {
      throw new ApiError(400, 'Envio inválido. Escolha a foto novamente.')
    }
    if (!(file instanceof File)) throw new ApiError(400, 'Nenhuma foto foi enviada.')

    const processed = await processImage(new Uint8Array(await file.arrayBuffer()))

    // Ordem: grava o arquivo, aponta o banco para ele e só então apaga o antigo. Se o banco falhar, o novo é descartado.
    const key = buildObjectKey(barbearia.id, 'services')
    await saveObject(key, processed)
    let updated
    try {
      updated = await prisma.service.update({
        where: { id: service.id, barbeariaId: barbearia.id },
        data: { imageUrl: objectUrl(key) },
        select: { imageUrl: true },
      })
    } catch (error) {
      await deleteObject(key).catch(() => undefined)
      throw error
    }
    await removeOldObject(service.imageUrl)

    return NextResponse.json({ imageUrl: updated.imageUrl })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services image POST]', error)
    return NextResponse.json({ error: 'Falha ao enviar a foto.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params

    const service = await prisma.service.findFirst({
      where: { id, barbeariaId: barbearia.id },
      select: { id: true, imageUrl: true },
    })
    if (!service) throw notFound()

    await prisma.service.update({
      where: { id: service.id, barbeariaId: barbearia.id },
      data: { imageUrl: null },
    })
    await removeOldObject(service.imageUrl)

    return NextResponse.json({ imageUrl: null })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services image DELETE]', error)
    return NextResponse.json({ error: 'Falha ao remover a foto.' }, { status: 500 })
  }
}
