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
import { checkLimited, getClientIp, hit, tooManyRequestsHeaders } from '@/lib/rate-limit'
import { getCurrentBarbeariaId } from '@/lib/tenant'

const HOUR_MS = 60 * 60 * 1000
const MAX_ACTIVE_APPOINTMENTS_PER_PHONE = 3

const bookingSchema = z.object({
  // O nome entra no texto do WhatsApp: tamanho limitado, sem quebras de linha nem links.
  name: z.string().trim().min(1, 'Name is required').max(60, 'Nome muito longo.')
    .refine((value) => !/[\r\n]/.test(value), 'Nome inválido.')
    .refine((value) => !/(https?:|www\.|:\/\/)/i.test(value), 'Nome inválido.'),
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
    const ip = getClientIp(req.headers)
    const ipRules = ip ? [{ key: `book:ip:${ip}`, limit: 10, windowMs: HOUR_MS }] : []
    const ipRetryAfter = checkLimited(ipRules)
    if (ipRetryAfter !== null) {
      return NextResponse.json(
        { error: 'Muitas tentativas de agendamento. Tente novamente mais tarde.' },
        { status: 429, headers: tooManyRequestsHeaders(ipRetryAfter) }
      )
    }
    hit(ipRules)

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

    const allBarbers = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, phone: true } })
    if (finalBarberId && !allBarbers.some((barber) => barber.id === finalBarberId)) {
      throw new AppointmentRuleError('Barbeiro não encontrado.')
    }

    const phone = normalizeBrazilPhone(parsed.phone)!
    const phoneRules = [{ key: `book:phone:${phone}`, limit: 3, windowMs: 24 * HOUR_MS }]
    const phoneRetryAfter = checkLimited(phoneRules)
    if (phoneRetryAfter !== null) {
      return NextResponse.json(
        { error: 'Limite diário de agendamentos para este telefone atingido.' },
        { status: 429, headers: tooManyRequestsHeaders(phoneRetryAfter) }
      )
    }

    const barbeariaId = await getCurrentBarbeariaId()
    const appointment = await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        // Telefone é único por barbearia: o mesmo número pode ser cliente de outra barbearia.
        where: { barbeariaId_phone: { barbeariaId, phone } },
        // Reserva pública não altera cadastro existente: quem conhece o telefone não pode renomear o cliente.
        update: {},
        create: { barbeariaId, name: parsed.name, phone },
      })

      const activeAppointments = await tx.appointment.count({
        where: {
          clientId: client.id,
          date: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })
      if (activeAppointments >= MAX_ACTIVE_APPOINTMENTS_PER_PHONE) {
        throw new AppointmentRuleError('Este telefone já possui o máximo de agendamentos ativos. Entre em contato com a barbearia.')
      }

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
          barbeariaId,
          clientId: client.id,
          serviceId: services[0].id,
          appointmentServices: { create: appointmentServiceCreateData(services) },
          barberId: freeBarber.id,
          date: datetime,
          notes: parsed.notes ? parsed.notes.slice(0, 50) : undefined,
          status: 'PENDING',
        },
        include: { service: true, appointmentServices: { include: { service: true } }, client: true },
      })
    }, {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })

    hit(phoneRules)

    const finalBarber = allBarbers.find(b => b.id === appointment.barberId);
    
    notifyAppointmentCreated({
      appointment,
      client: appointment.client,
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
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services, barbers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
