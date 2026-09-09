import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { normalizeBrazilPhone } from '@/lib/format'

const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.'),
  serviceId: z.string().min(1, 'Service is required'),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  barberId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.parse(body)

    const phone = normalizeBrazilPhone(parsed.phone)!
    // Find or create client
    let client = await prisma.client.findUnique({
      where: { phone },
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: parsed.name,
          phone,
        },
      })
    }

    // Criar data no fuso local (evita problemas de UTC)
    const [year, month, day] = parsed.date.split('-').map(Number)
    const [hour, minute] = parsed.time.split(':').map(Number)
    const datetime = new Date(year, month - 1, day, hour, minute, 0)
    const endDatetime = new Date(datetime)
    
    const serviceIds = Array.from(new Set(parsed.serviceIds ?? [parsed.serviceId]))
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
    })
    if (services.length !== serviceIds.length) throw new Error('Service not found')
    const totalDuration = services.reduce((total, service) => total + service.durationMins, 0)
    endDatetime.setMinutes(endDatetime.getMinutes() + totalDuration)

    let finalBarberId = parsed.barberId && parsed.barberId !== 'any' ? parsed.barberId : null

    // Se não escolheu barbeiro, auto-atribuir um livre
    if (!finalBarberId) {
      const allBarbers = await prisma.user.findMany({ select: { id: true } })
      
      const overlappingAppointments = await prisma.appointment.findMany({
        where: {
          date: { gte: new Date(year, month - 1, day, 0, 0, 0), lte: new Date(year, month - 1, day, 23, 59, 59) },
          status: { not: 'CANCELED' }
        },
        include: {
          service: true,
          appointmentServices: { include: { service: true } },
        }
      })

      // Achar um barbeiro que não tenha conflito de horário
      const freeBarber = allBarbers.find(b => {
        const hasConflict = overlappingAppointments.some(appt => {
          if (appt.barberId !== b.id) return false
          const apptStart = appt.date.getTime()
          const apptDuration = appt.appointmentServices.length > 0
            ? appt.appointmentServices.reduce((total, item) => total + item.service.durationMins, 0)
            : appt.service.durationMins
          const apptEnd = apptStart + (apptDuration * 60000)
          const reqStart = datetime.getTime()
          const reqEnd = endDatetime.getTime()
          return (reqStart < apptEnd && reqEnd > apptStart)
        })
        return !hasConflict
      })

      if (freeBarber) {
        finalBarberId = freeBarber.id
      } else {
        // Fallback para o primeiro se todos estiverem "ocupados" (pode acontecer se a lógica falhar)
        finalBarberId = allBarbers[0]?.id || null
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId: serviceIds[0],
        appointmentServices: {
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
        barberId: finalBarberId,
        date: datetime,
        notes: parsed.notes,
        status: 'PENDING',
      },
      include: { service: true, client: true, appointmentServices: { include: { service: true } } },
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        clientName: appointment.client.name,
        service: appointment.appointmentServices.map((item) => item.service.name).join(' + '),
        date: appointment.date,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Book POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
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
