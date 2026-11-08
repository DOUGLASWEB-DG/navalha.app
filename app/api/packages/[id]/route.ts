import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { notFound, requireTenantUser, tenantErrorResponse } from '@/lib/api'

const updatePackageSchema = z.object({
  name: z.string().trim().min(2).max(LIMITES.nome).optional(),
  description: z.string().max(LIMITES.notas).optional().nullable(),
  price: z.number().min(0).optional(),
  totalCuts: z.number().int().min(1).optional(),
  validityDays: z.number().int().min(1).optional(),
  barberId: z.string().max(LIMITES.id).optional().nullable(),
  active: z.boolean().optional(),
}).strict()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await req.json()
    const parsed = updatePackageSchema.parse(body)

    const existing = await prisma.package.findFirst({
      where: { id, barbeariaId: barbearia.id },
    })
    if (!existing) throw notFound('Pacote não encontrado')

    // Se for barbeiro, só pode editar pacotes vinculados a si mesmo
    if (user.role === 'BARBER' && existing.barberId !== user.id) {
      return NextResponse.json({ error: 'Você só pode gerenciar seus próprios pacotes' }, { status: 403 })
    }

    const updated = await prisma.package.update({
      where: { id, barbeariaId: barbearia.id },
      data: parsed,
      include: {
        barber: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Package PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar pacote' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const resolvedParams = await params
    const id = resolvedParams.id

    const existing = await prisma.package.findFirst({
      where: { id, barbeariaId: barbearia.id },
    })
    if (!existing) throw notFound('Pacote não encontrado')

    if (user.role === 'BARBER' && existing.barberId !== user.id) {
      return NextResponse.json({ error: 'Você só pode excluir seus próprios pacotes' }, { status: 403 })
    }

    // Soft delete: desativa para preservar histórico de clientes que já compraram
    await prisma.package.update({
      where: { id, barbeariaId: barbearia.id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Package DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover pacote' }, { status: 500 })
  }
}
