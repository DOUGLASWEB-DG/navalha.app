import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { readImageUpload, removeStoredImage, replaceStoredImage } from '@/lib/uploads/route-helpers'

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

    const image = await readImageUpload(req)
    const imageUrl = await replaceStoredImage({
      barbeariaId: barbearia.id,
      kind: 'services',
      image,
      oldUrl: service.imageUrl,
      logTag: 'Services image',
      setUrl: async (url) => {
        await prisma.service.update({ where: { id: service.id, barbeariaId: barbearia.id }, data: { imageUrl: url } })
      },
    })

    return NextResponse.json({ imageUrl })
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
    await removeStoredImage(service.imageUrl, 'Services image')

    return NextResponse.json({ imageUrl: null })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services image DELETE]', error)
    return NextResponse.json({ error: 'Falha ao remover a foto.' }, { status: 500 })
  }
}
