import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { AppointmentStatus, Prisma } from '@prisma/client'
import {
  AppointmentRuleError,
  getAppointmentDayRange,
  parseIncomingAppointmentDate,
  validateAppointmentSchedule,
} from '@/lib/appointment-rules'
import {
  appointmentServiceCreateData,
  getActiveServices,
  getServiceTotals,
  normalizeServiceIds,
} from '@/lib/appointment-services'
import { notifyAppointmentCreated } from '@/lib/notifications'

const createSchema = z.object({
  clientId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  serviceId: z.string().min(1).optional(),
  barberId: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
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
      const startValue = `${year}-${String(month).padStart(2, '0')}-01`
      const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
      const { start } = getAppointmentDayRange(startValue)
      const { start: end } = getAppointmentDayRange(nextMonth)
      where.date = { gte: start, lt: end }
    } else if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number)
      if (!year || !month || !day) {
        return NextResponse.json({ error: 'Invalid date param. Expected yyyy-MM-dd' }, { status: 400 })
      }

      // Interpreta como data local (consistente com /api/book)
      const { start, end } = getAppointmentDayRange(dateParam)
      where.date = { gte: start, lt: end }
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
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    const body = await req.json()
    const parsed = createSchema.parse(body)
    if (parsed.status && parsed.status !== AppointmentStatus.PENDING) {
      throw new AppointmentRuleError('Novos agendamentos devem iniciar como pendentes.')
    }

    let barberId = parsed.barberId
    if (user?.role === 'BARBER') {
      barberId = user.id // Se for barbeiro, forçar o próprio ID
    }

    const serviceIds = normalizeServiceIds(parsed.serviceIds, parsed.serviceId)
    const [client, services] = await Promise.all([
      prisma.client.findUnique({ where: { id: parsed.clientId } }),
      getActiveServices(serviceIds),
    ])
    if (!client || !client.isActive) throw new AppointmentRuleError('Cliente não encontrado ou inativo.')
    const totals = getServiceTotals(services)

    const date = parsed.date.includes('Z') || parsed.date.includes('+')
      ? new Date(parsed.date)
      : parseIncomingAppointmentDate(parsed.date)
    if (Number.isNaN(date.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')
    const isAdmin = user?.role === 'ADMIN'
    
    validateAppointmentSchedule(date, totals.durationMins, !isAdmin)

    const barbers = await prisma.user.findMany({
      where: user.role === 'BARBER' ? { id: user.id } : undefined,
      select: { id: true },
    })
    if (barberId && !barbers.some((barber) => barber.id === barberId)) {
      throw new AppointmentRuleError('Barbeiro não encontrado.')
    }
    const candidates = barberId ? barbers.filter((barber) => barber.id === barberId) : barbers
    const appointment = await prisma.$transaction(async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: { status: { not: AppointmentStatus.CANCELED }, barberId: { in: candidates.map((barber) => barber.id) } },
        include: { service: { select: { durationMins: true } }, appointmentServices: { select: { durationMins: true } } },
      })
      const availableBarber = candidates.find((barber) => !appointments.some((appointment) => {
        const duration = appointment.appointmentServices.length
          ? appointment.appointmentServices.reduce((total, item) => total + item.durationMins, 0)
          : appointment.service.durationMins
        const appointmentEnd = appointment.date.getTime() + duration * 60_000
        const requestedEnd = date.getTime() + totals.durationMins * 60_000
        return appointment.barberId === barber.id && date.getTime() < appointmentEnd && requestedEnd > appointment.date.getTime()
      }))
      if (!isAdmin && !availableBarber) throw new AppointmentRuleError('Esse horário não está mais disponível.')
      
      const selectedBarber = isAdmin && !availableBarber ? candidates[0] : availableBarber
      if (!selectedBarber) throw new AppointmentRuleError('Barbeiro não encontrado.')

      return await tx.appointment.create({
        data: {
          client: { connect: { id: client.id } },
          service: { connect: { id: services[0].id } }, // FIXME: legacy field
          appointmentServices: { create: appointmentServiceCreateData(services) },
          barber: { connect: { id: selectedBarber.id } },
          date,
          status: parsed.status,
          notes: parsed.notes,
        },
        include: {
          client: true,
          service: true,
          appointmentServices: { include: { service: true } },
          barber: { select: { id: true, name: true } },
        },
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })

    notifyAppointmentCreated({
      appointment,
      client,
      barber: appointment.barber,
      services,
      totalPrice: totals.price,
      totalDurationMins: totals.durationMins
    }).catch(console.error);

    return NextResponse.json(appointment, { status: 201 })
    } catch (error: any) {
    console.error('[Appointments POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof AppointmentRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.code === 'P2034') {
      return NextResponse.json({ error: 'O horário acabou de ser reservado por outra pessoa. Escolha outro horário.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
