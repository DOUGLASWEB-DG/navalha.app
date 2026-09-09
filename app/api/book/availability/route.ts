import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const [year, month, day] = dateParam.split('-').map(Number)
    const start = new Date(year, month - 1, day, 0, 0, 0)
    const end = new Date(year, month - 1, day, 23, 59, 59)

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { not: 'CANCELED' },
      },
      select: {
        barberId: true,
        date: true,
        service: {
          select: { durationMins: true },
        },
        appointmentServices: {
          select: { service: { select: { durationMins: true } } },
        },
      },
    })

    // Retorna a lista de agendamentos para o frontend calcular a disponibilidade
    return NextResponse.json(appointments.map((appointment) => ({
      ...appointment,
      service: {
        durationMins: appointment.appointmentServices.length > 0
          ? appointment.appointmentServices.reduce((total, item) => total + item.service.durationMins, 0)
          : appointment.service.durationMins,
      },
    })))
  } catch (error) {
    console.error('[Availability GET]', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
