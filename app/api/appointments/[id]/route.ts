import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendTextMessage } from '@/lib/whatsapp'

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

    // Enviar mensagem para o cliente quando for CONFIRMADO
    if (parsed.status === 'CONFIRMED') {
      try {
        const clientPhone = appointment.client.phone;
        if (clientPhone) {
          // Remover tudo que não for número
          let number = clientPhone.replace(/\D/g, '');
          // Se tiver 10 ou 11 dígitos, provavelmente esqueceu o DDI (55)
          if (number.length === 10 || number.length === 11) {
            number = '55' + number; 
          }
          
          // Formatar data e hora
          const { format } = require('date-fns');
          const { ptBR } = require('date-fns/locale');
          const dataFormatada = format(new Date(appointment.date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });
          
          const msg = `Olá, ${appointment.client.name}! Tudo bem?\n\nPassando para confirmar o seu agendamento de *${appointment.service.name}*.\n\n📅 Data: ${dataFormatada}\n\nSeu horário está confirmadíssimo! Te esperamos na barbearia. 💈✂️`;
          
          await sendTextMessage(number, msg).catch(e => console.error('WhatsApp client msg error:', e));
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
          include: { service: true, client: true },
        })
        if (appt) {
          const newTx = await prisma.transaction.create({
            data: {
              type: 'INCOME',
              amount: appt.service.price,
              description: `${appt.service.name} — ${appt.client.name}`,
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
