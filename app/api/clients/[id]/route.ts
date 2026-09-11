import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { normalizeBrazilPhone } from '@/lib/format'

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.').optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const data = {
      ...parsed,
      ...(parsed.phone ? { phone: normalizeBrazilPhone(parsed.phone)! } : {}),
    }
    const client = await prisma.client.update({
      where: { id },
      data,
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('[Clients PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Soft delete: inativar em vez de deletar
    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Clients DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
