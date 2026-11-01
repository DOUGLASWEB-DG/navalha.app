import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { normalizeBrazilPhone } from '@/lib/format'
import { requireTenantAdmin, requireTenantUser, tenantErrorResponse } from '@/lib/api'

const updateSchema = z.object({
  name: z.string().trim().min(1).max(LIMITES.nome).optional(),
  phone: z.string().max(LIMITES.telefone).refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.').optional(),
  email: z.string().max(LIMITES.email).email().optional().or(z.literal('')),
  notes: z.string().max(LIMITES.notas).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantUser()
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const data = {
      ...parsed,
      ...(parsed.phone ? { phone: normalizeBrazilPhone(parsed.phone)! } : {}),
    }
    const client = await prisma.client.update({
      where: { id, barbeariaId: barbearia.id },
      data,
    })

    return NextResponse.json(client)
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Clients PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um cliente cadastrado com este telefone.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params
    // Soft delete: inativar em vez de deletar
    await prisma.client.update({
      where: { id, barbeariaId: barbearia.id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Clients DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
