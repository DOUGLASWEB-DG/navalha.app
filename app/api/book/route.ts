import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { normalizeBrazilPhone } from '@/lib/format'

const OPENING_MINUTES = 8 * 60
const CLOSING_MINUTES = 20 * 60

const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.'),
  serviceId: z.string().min(1, 'Service is required'),
  barberId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  notes: z.string().optional(),
})

class BookingRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingRuleError'
  }
}

function parseBookingDate(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const datetime = new Date(year, month - 1, day, hour, minute, 0)

  if (
    datetime.getFullYear() !== year ||
    datetime.getMonth() !== month - 1 ||
    datetime.getDate() !== day ||
    datetime.getHours() !== hour ||
    datetime.getMinutes() !== minute
  ) {
    throw new BookingRuleError('Data ou horário inválido.')
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (datetime < todayStart) {
    throw new BookingRuleError('Não é possível agendar em uma data passada.')
  }
  if (datetime < today) {
    throw new BookingRuleError('Escolha um horário futuro.')
  }

  if (datetime.getDay() === 0) {
    throw new BookingRuleError('A barbearia não funciona aos domingos.')
  }

  const minutes = hour * 60 + minute
  if (minutes < OPENING_MINUTES || minutes >= CLOSING_MINUTES || minute % 30 !== 0) {
    throw new BookingRuleError('Escolha um horário entre 08:00 e 19:30.')
  }

  return { datetime, year, month, day }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.parse(body)

    const { datetime, year, month, day } = parseBookingDate(parsed.date, parsed.time)
    const endDatetime = new Date(datetime)

    const service = await prisma.service.findFirst({
      where: { id: parsed.serviceId, active: true },
    })
    if (!service) throw new BookingRuleError('Serviço não encontrado ou indisponível.')
    endDatetime.setMinutes(endDatetime.getMinutes() + service.durationMins)
    const closingTime = new Date(datetime)
    closingTime.setHours(20, 0, 0, 0)
    if (endDatetime > closingTime) {
      throw new BookingRuleError('Esse serviço precisa terminar até as 20:00.')
    }

    let finalBarberId = parsed.barberId && parsed.barberId !== 'any' ? parsed.barberId : null

    const allBarbers = await prisma.user.findMany({ select: { id: true } })
    if (finalBarberId && !allBarbers.some((barber) => barber.id === finalBarberId)) {
      throw new BookingRuleError('Barbeiro não encontrado.')
    }

    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(year, month - 1, day, 0, 0, 0),
          lt: new Date(year, month - 1, day + 1, 0, 0, 0),
        },
        status: { not: 'CANCELED' },
      },
      include: { service: true },
    })

    const candidateBarbers = finalBarberId
      ? allBarbers.filter((barber) => barber.id === finalBarberId)
      : allBarbers
    const freeBarber = candidateBarbers.find((barber) => {
      return !overlappingAppointments.some((appointment) => {
        if (appointment.barberId !== barber.id) return false
        const appointmentEnd = appointment.date.getTime() + appointment.service.durationMins * 60000
        return datetime.getTime() < appointmentEnd && endDatetime.getTime() > appointment.date.getTime()
      })
    })

    if (!freeBarber) {
      throw new BookingRuleError('Esse horário não está mais disponível.')
    }
    finalBarberId = freeBarber.id

    const phone = normalizeBrazilPhone(parsed.phone)!
    let client = await prisma.client.findUnique({ where: { phone } })
    if (!client) {
      client = await prisma.client.create({ data: { name: parsed.name, phone } })
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId: parsed.serviceId,
        barberId: finalBarberId,
        date: datetime,
        notes: parsed.notes,
        status: 'PENDING',
      },
      include: { service: true, client: true },
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        clientName: appointment.client.name,
        service: appointment.service.name,
        date: appointment.date,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Book POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof BookingRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
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
