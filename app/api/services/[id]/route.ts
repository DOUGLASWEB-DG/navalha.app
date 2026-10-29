import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { deleteObject, keyFromUrl } from '@/lib/uploads/storage'

const updateSchema = z.object({
  name: z.string().trim().min(1).max(LIMITES.nome).optional(),
  description: z.string().max(LIMITES.descricao).optional(),
  price: z.number().positive().optional(),
  durationMins: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)
    const service = await prisma.service.update({ where: { id, barbeariaId: barbearia.id }, data: parsed })
    return NextResponse.json(service)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services PATCH]', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params
    const service = await prisma.service.findFirst({ where: { id, barbeariaId: barbearia.id }, select: { imageUrl: true } })
    if (!service) throw notFound()
    await prisma.service.delete({ where: { id, barbeariaId: barbearia.id } })
    // Serviço excluído: a foto fica órfã no disco, então é removida (falha aqui não desfaz a exclusão)
    const key = keyFromUrl(service.imageUrl)
    if (key) await deleteObject(key).catch((error) => console.error('[Services DELETE] foto órfã não removida', error))
    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
