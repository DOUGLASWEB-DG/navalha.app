import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppointmentRuleError, getAppointmentDayRange } from '@/lib/appointment-rules'
import { getActiveServices, getServiceTotals, normalizeServiceIds } from '@/lib/appointment-services'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const serviceIdsParam = searchParams.get('serviceIds')

    if (!dateParam) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const { start, end } = getAppointmentDayRange(dateParam)
    let requestedDurationMins: number | undefined
    if (serviceIdsParam) {
      const serviceIds = normalizeServiceIds(serviceIdsParam.split(','))
      const services = await getActiveServices(serviceIds)
      requestedDurationMins = getServiceTotals(services).durationMins
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lt: end },
        status: { not: 'CANCELED' },
      },
      select: {
        barberId: true,
        date: true,
        service: { select: { durationMins: true } },
        appointmentServices: { select: { durationMins: true } },
      },
    })

    return NextResponse.json({
      requestedDurationMins,
      appointments: appointments.map((appointment) => ({
        barberId: appointment.barberId,
        date: appointment.date,
        service: {
          durationMins: appointment.appointmentServices.length
            ? appointment.appointmentServices.reduce((total, service) => total + service.durationMins, 0)
            : appointment.service.durationMins,
        },
      })),
    })
  } catch (error) {
    console.error('[Availability GET]', error)
    if (error instanceof AppointmentRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
