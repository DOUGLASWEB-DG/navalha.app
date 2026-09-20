import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { tenantConfig } from '@/config/tenant'
import { notifyAppointmentCreated } from '@/lib/notifications'
import { normalizeBrazilPhone } from '@/lib/format'
import {
  AppointmentRuleError,
  parseAppointmentDate,
  validateAppointmentSchedule,
  getAppointmentDayRange,
} from '@/lib/appointment-rules'
import {
  appointmentServiceCreateData,
  getActiveServices,
  getServiceTotals,
  normalizeServiceIds,
} from '@/lib/appointment-services'

const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.'),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  serviceId: z.string().min(1).optional(),
  barberId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  notes: z.string().optional(),
})

function parseBookingDate(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const datetime = parseAppointmentDate(`${date}T${time}`)
  return { datetime, year, month, day }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.parse(body)

    const { datetime, year, month, day } = parseBookingDate(parsed.date, parsed.time)
    const endDatetime = new Date(datetime)

    const serviceIds = normalizeServiceIds(parsed.serviceIds, parsed.serviceId)
    const services = await getActiveServices(serviceIds)
    const totals = getServiceTotals(services)
    endDatetime.setMinutes(endDatetime.getMinutes() + totals.durationMins)
    validateAppointmentSchedule(datetime, totals.durationMins)

    let finalBarberId = parsed.barberId && parsed.barberId !== 'any' ? parsed.barberId : null

    const allBarbers = await prisma.user.findMany({ select: { id: true, name: true, phone: true } })
    if (finalBarberId && !allBarbers.some((barber) => barber.id === finalBarberId)) {
      throw new AppointmentRuleError('Barbeiro não encontrado.')
    }

    const phone = normalizeBrazilPhone(parsed.phone)!
    const client = await prisma.client.upsert({
      where: { phone },
      update: { name: parsed.name },
      create: { name: parsed.name, phone },
    })

    const appointment = await prisma.$transaction(async (tx) => {
      const overlappingAppointments = await tx.appointment.findMany({
        where: {
          date: {
            gte: getAppointmentDayRange(parsed.date).start,
            lt: getAppointmentDayRange(parsed.date).end,
          },
          status: { not: 'CANCELED' },
        },
        include: { service: true, appointmentServices: true },
      })

      const candidateBarbers = finalBarberId
        ? allBarbers.filter((barber) => barber.id === finalBarberId)
        : allBarbers
      const freeBarber = candidateBarbers.find((barber) => {
        return !overlappingAppointments.some((appointment) => {
          if (appointment.barberId !== barber.id) return false
          const duration = appointment.appointmentServices.length
            ? appointment.appointmentServices.reduce((total, service) => total + service.durationMins, 0)
            : appointment.service.durationMins
          const appointmentEnd = appointment.date.getTime() + duration * 60000
          return datetime.getTime() < appointmentEnd && endDatetime.getTime() > appointment.date.getTime()
        })
      })

      if (!freeBarber) {
        throw new AppointmentRuleError('Esse horário não está mais disponível.')
      }

      return await tx.appointment.create({
        data: {
          clientId: client.id,
          serviceId: services[0].id,
          appointmentServices: { create: appointmentServiceCreateData(services) },
          barberId: freeBarber.id,
          date: datetime,
          notes: parsed.notes,
          status: 'PENDING',
        },
        include: { service: true, appointmentServices: { include: { service: true } }, client: true },
      })
    }, {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })

    const finalBarber = allBarbers.find(b => b.id === appointment.barberId);
    
    notifyAppointmentCreated({
      appointment,
      client,
      barber: finalBarber,
      services,
      totalPrice: totals.price,
      totalDurationMins: totals.durationMins
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        clientName: appointment.client.name,
        service: appointment.service.name,
        services: appointment.appointmentServices.map((item) => item.service.name),
        totalPrice: totals.price,
        totalDurationMins: totals.durationMins,
        date: appointment.date,
      },
    }, { status: 201 })
    } catch (error: any) {
    console.error('[Book POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof AppointmentRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.code === 'P2034') {
      return NextResponse.json({ error: 'O horário acabou de ser reservado por outra pessoa. Escolha outro horário.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Ocorreu um problema ao processar seu agendamento. Tente novamente.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, durationMins: true, description: true },
      orderBy: { name: 'asc' },
    })

    const barbers = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services, barbers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
