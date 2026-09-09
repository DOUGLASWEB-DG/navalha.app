import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendTextMessage } from '@/lib/whatsapp'
import { normalizeBrazilPhone } from '@/lib/format'

const updateSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const { serviceIds, ...appointmentFields } = parsed
    const data: any = { ...appointmentFields }
    if (parsed.date) data.date = new Date(parsed.date)
    if (serviceIds) {
      data.serviceId = serviceIds[0]
      data.appointmentServices = {
        deleteMany: {},
        create: Array.from(new Set(serviceIds)).map((serviceId) => ({ serviceId })),
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, service: true, appointmentServices: { include: { service: true } } },
    })

    // Enviar mensagem para o cliente quando for CONFIRMADO
    if (parsed.status === 'CONFIRMED') {
      try {
        const clientPhone = appointment.client.phone;
        if (clientPhone) {
          const number = normalizeBrazilPhone(clientPhone);
          if (!number) {
            console.error(`[Appointments PATCH] Invalid client phone for ${appointment.client.id}`);
          } else {
          
          // Formatar data e hora
          const { format } = require('date-fns');
          const { ptBR } = require('date-fns/locale');
          const dataFormatada = format(new Date(appointment.date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });
          
          const services = appointment.appointmentServices?.length
            ? appointment.appointmentServices.map((item) => item.service.name).join(' + ')
            : appointment.service.name
          const msg = `Olá, ${appointment.client.name}! Tudo bem?\n\nPassando para confirmar o seu agendamento de *${services}*.\n\n📅 Data: ${dataFormatada}\n\nSeu horário está confirmadíssimo! Te esperamos na barbearia. 💈✂️`;
          
          await sendTextMessage(number, msg).catch(e => console.error('WhatsApp client msg error:', e));
          }
        }
      } catch (e) {
        console.error('Error with WA client notification:', e);
      }
    }

    // Auto-create income transaction when completed
    if (parsed.status === 'COMPLETED') {
      const existing = await prisma.transaction.findUnique({
        where: { appointmentId: id },
      })
      if (!existing) {
        const appt = await prisma.appointment.findUnique({
          where: { id },
          include: { service: true, client: true, appointmentServices: { include: { service: true } } },
        })
        if (appt) {
        const services = appt.appointmentServices.length > 0
          ? appt.appointmentServices.map((item) => item.service)
          : [appt.service]
        const totalAmount = services.reduce((sum, service) => sum + service.price, 0)
        const serviceNames = services.map((service) => service.name).join(' + ')
        const newTx = await prisma.transaction.create({
          data: {
            type: 'INCOME',
            amount: totalAmount,
            description: `${serviceNames} — ${appt.client.name}`,
              category: 'Service',
              appointmentId: id,
              date: new Date(),
            },
          })

          // Notificação no WhatsApp
          try {
            const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
            if (ownerNumber) {
              const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTx.amount);
              const msg = `🟢 *Serviço Concluído*\n\nTipo: Receita\nValor: ${formattedAmount}\nDescrição: ${newTx.description}\nCategoria: ${newTx.category}`;
              await sendTextMessage(ownerNumber, msg).catch(e => console.error('WhatsApp message error:', e));
            }
          } catch (e) {
            console.error('Error with WA integration:', e);
          }
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
