import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { readImageUpload, removeStoredImage, replaceStoredImage } from '@/lib/uploads/route-helpers'

// Foto do barbeiro/admin. Só o admin da barbearia troca (decisão do Bloco 4); o próprio barbeiro não.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params

    // Usuário de outra barbearia ou inexistente: 404, antes de ler o corpo
    const user = await prisma.user.findFirst({
      where: { id, barbeariaId: barbearia.id },
      select: { id: true, avatarUrl: true },
    })
    if (!user) throw notFound('Usuário não encontrado')

    const image = await readImageUpload(req)
    const avatarUrl = await replaceStoredImage({
      barbeariaId: barbearia.id,
      kind: 'avatars',
      image,
      oldUrl: user.avatarUrl,
      logTag: 'User avatar',
      setUrl: async (url) => {
        await prisma.user.update({ where: { id: user.id, barbeariaId: barbearia.id }, data: { avatarUrl: url } })
      },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[User avatar POST]', error)
    return NextResponse.json({ error: 'Falha ao enviar a foto.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params

    const user = await prisma.user.findFirst({
      where: { id, barbeariaId: barbearia.id },
      select: { id: true, avatarUrl: true },
    })
    if (!user) throw notFound('Usuário não encontrado')

    await prisma.user.update({
      where: { id: user.id, barbeariaId: barbearia.id },
      data: { avatarUrl: null },
    })
    await removeStoredImage(user.avatarUrl, 'User avatar')

    return NextResponse.json({ avatarUrl: null })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[User avatar DELETE]', error)
    return NextResponse.json({ error: 'Falha ao remover a foto.' }, { status: 500 })
  }
}
