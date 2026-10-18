import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
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
    await prisma.service.delete({ where: { id, barbeariaId: barbearia.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
