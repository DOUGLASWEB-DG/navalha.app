import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireTenantAdmin, requireTenantUser, tenantErrorResponse } from '@/lib/api'

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  durationMins: z.number().int().positive().default(30),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    const { barbearia } = await requireTenantUser()
    const services = await prisma.service.findMany({
      where: { barbeariaId: barbearia.id, active: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(services)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services GET]', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const service = await prisma.service.create({ data: { ...parsed, barbeariaId: barbearia.id } })
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Services POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
