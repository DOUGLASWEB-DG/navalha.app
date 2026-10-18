import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { normalizeBrazilPhone } from '@/lib/format'
import { requireTenantUser, tenantErrorResponse } from '@/lib/api'

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantUser()
    const { searchParams } = new URL(req.url)
    const minimal = searchParams.get('minimal') === 'true'
    const search = searchParams.get('search') ?? ''

    if (minimal) {
      const clients = await prisma.client.findMany({
        where: { barbeariaId: barbearia.id, isActive: true },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(clients)
    }

    const clients = await prisma.client.findMany({
      where: {
        barbeariaId: barbearia.id,
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Estatísticas por cliente em duas agregações (sem consulta por cliente).
    const clientIds = clients.map((client) => client.id)
    const [completed, upcoming] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['clientId'],
        where: { barbeariaId: barbearia.id, clientId: { in: clientIds }, status: 'COMPLETED' },
        _count: { _all: true },
        _max: { date: true },
      }),
      prisma.appointment.groupBy({
        by: ['clientId'],
        where: { barbeariaId: barbearia.id, clientId: { in: clientIds }, status: { in: ['PENDING', 'CONFIRMED'] }, date: { gte: new Date() } },
        _min: { date: true },
      }),
    ])
    const completedByClient = new Map(completed.map((row) => [row.clientId, row]))
    const upcomingByClient = new Map(upcoming.map((row) => [row.clientId, row]))

    return NextResponse.json(clients.map((client) => ({
      ...client,
      completedCount: completedByClient.get(client.id)?._count._all ?? 0,
      lastCompletedAt: completedByClient.get(client.id)?._max.date ?? null,
      nextAppointmentAt: upcomingByClient.get(client.id)?._min.date ?? null,
    })))
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Clients GET]', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantUser()
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        barbeariaId: barbearia.id,
        name: parsed.name,
        phone: normalizeBrazilPhone(parsed.phone)!,
        email: parsed.email || undefined,
        notes: parsed.notes,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Clients POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um cliente cadastrado com este telefone.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
