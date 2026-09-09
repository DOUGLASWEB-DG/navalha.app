import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'

const createSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  barberId: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const status = searchParams.get('status')

    const monthParam = searchParams.get('month')

    const where: any = {}

    // Filtra pelo barbeiro logado se for role BARBER
    if (user?.role === 'BARBER') {
      where.barberId = user.id
    }

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      if (!year || !month) {
        return NextResponse.json({ error: 'Invalid month param. Expected yyyy-MM' }, { status: 400 })
      }
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const end = new Date(year, month, 0, 23, 59, 59, 999) // last day of month
      where.date = { gte: start, lte: end }
    } else if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number)
      if (!year || !month || !day) {
        return NextResponse.json({ error: 'Invalid date param. Expected yyyy-MM-dd' }, { status: 400 })
      }

      // Interpreta como data local (consistente com /api/book)
      const start = new Date(year, month - 1, day, 0, 0, 0, 0)
      const end = new Date(year, month - 1, day, 23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        appointmentServices: { include: { service: true } },
        barber: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[Appointments GET]', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    const body = await req.json()
    const parsed = createSchema.parse(body)

    let barberId = parsed.barberId
    if (user?.role === 'BARBER') {
      barberId = user.id // Se for barbeiro, forçar o próprio ID
    }

    const serviceIds = Array.from(new Set(parsed.serviceIds ?? [parsed.serviceId]))
    const appointment = await prisma.appointment.create({
      data: {
        clientId: parsed.clientId,
        serviceId: serviceIds[0],
        appointmentServices: {
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
        barberId: barberId,
        date: new Date(parsed.date),
        notes: parsed.notes,
        status: parsed.status ?? 'PENDING',
      },
      include: {
        client: true,
        service: true,
        appointmentServices: { include: { service: true } },
        barber: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('[Appointments POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
