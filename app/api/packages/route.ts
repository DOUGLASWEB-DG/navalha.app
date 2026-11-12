import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { requireTenantAdmin, requireTenantUser, tenantErrorResponse } from '@/lib/api'

const createPackageSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(LIMITES.nome),
  description: z.string().max(LIMITES.notas).optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  totalCuts: z.number().int().min(1, 'Quantidade de cortes deve ser pelo menos 1').default(4),
  validityDays: z.number().int().min(1, 'Validade deve ser de pelo menos 1 dia').default(30),
  barberId: z.string().max(LIMITES.id).optional().nullable(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantUser()
    const { searchParams } = new URL(req.url)
    const showAll = searchParams.get('all') === 'true'

    const packages = await prisma.package.findMany({
      where: {
        barbeariaId: barbearia.id,
        ...(showAll ? {} : { active: true }),
      },
      include: {
        barber: { select: { id: true, name: true } },
        _count: { select: { clientPackages: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(packages)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Packages GET]', error)
    return NextResponse.json({ error: 'Erro ao listar pacotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const body = await req.json()
    const parsed = createPackageSchema.parse(body)

    // Se for barbeiro, o pacote fica automaticamente amarrado a ele
    const barberId = user.role === 'BARBER' ? user.id : (parsed.barberId || null)

    const newPackage = await prisma.package.create({
      data: {
        barbeariaId: barbearia.id,
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        totalCuts: parsed.totalCuts,
        validityDays: parsed.validityDays,
        barberId,
      },
      include: {
        barber: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(newPackage, { status: 201 })
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Packages POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
  }
}
