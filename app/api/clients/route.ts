import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const minimal = searchParams.get('minimal') === 'true'
    const search = searchParams.get('search') ?? ''

    if (minimal) {
      const clients = await prisma.client.findMany({
        where: { isActive: true },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(clients)
    }

    const clients = await prisma.client.findMany({
      where: {
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
        appointments: {
          take: 1,
          orderBy: { date: 'desc' },
          include: { service: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('[Clients GET]', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || undefined,
        notes: parsed.notes,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('[Clients POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
