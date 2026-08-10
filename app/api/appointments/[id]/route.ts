import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const data: any = { ...parsed }
    if (parsed.date) data.date = new Date(parsed.date)

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, service: true },
    })

    // Auto-create income transaction when completed
    if (parsed.status === 'COMPLETED') {
      const existing = await prisma.transaction.findUnique({
        where: { appointmentId: id },
      })
      if (!existing) {
        const appt = await prisma.appointment.findUnique({
          where: { id },
          include: { service: true, client: true },
        })
        if (appt) {
          await prisma.transaction.create({
            data: {
              type: 'INCOME',
              amount: appt.service.price,
              description: `${appt.service.name} — ${appt.client.name}`,
              category: 'Service',
              appointmentId: id,
              date: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[Appointments PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Appointments DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
  }
}
