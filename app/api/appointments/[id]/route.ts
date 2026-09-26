import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendTextMessage } from '@/lib/whatsapp'
import { normalizeBrazilPhone } from '@/lib/format'
import { Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import {
  AppointmentRuleError,
  assertStatusTransition,
  parseIncomingAppointmentDate,
  validateAppointmentSchedule,
} from '@/lib/appointment-rules'
import {
  appointmentServiceCreateData,
  getActiveServices,
  getAppointmentServiceTotals,
  getServiceTotals,
  normalizeServiceIds,
} from '@/lib/appointment-services'

const updateSchema = z.object({
  clientId: z.string().optional(),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  serviceId: z.string().min(1).optional(),
  barberId: z.string().nullable().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const current = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, appointmentServices: { include: { service: true } }, client: true },
    })
    if (!current) return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
    if (user.role === 'BARBER' && current.barberId !== user.id) {
      return NextResponse.json({ error: 'Você não pode alterar este agendamento.' }, { status: 403 })
    }

    const isAdmin = user.role === 'ADMIN'
    const nextStatus = parsed.status ?? current.status
    assertStatusTransition(current.status, nextStatus, current.date, isAdmin)
    const hasServiceChange = parsed.serviceIds !== undefined || parsed.serviceId !== undefined
    const hasScheduleChange = parsed.clientId !== undefined || hasServiceChange ||
      parsed.barberId !== undefined || parsed.date !== undefined || parsed.notes !== undefined
    if (!isAdmin && hasScheduleChange && (current.status === 'COMPLETED' || current.status === 'CANCELED')) {
      throw new AppointmentRuleError('Agendamentos concluídos ou cancelados não podem ser editados.')
    }

    const currentServices = current.appointmentServices.length
      ? current.appointmentServices.map((item) => item.service)
      : [current.service]
    const nextServices = hasServiceChange
      ? await getActiveServices(normalizeServiceIds(parsed.serviceIds, parsed.serviceId))
      : currentServices
    const nextService = nextServices[0]
    const nextTotals = getServiceTotals(nextServices)

    const nextClientId = parsed.clientId ?? current.clientId
    if (parsed.clientId) {
      const client = await prisma.client.findUnique({ where: { id: nextClientId } })
      if (!client || !client.isActive) throw new AppointmentRuleError('Cliente não encontrado ou inativo.')
    }

    const nextBarberId = user.role === 'BARBER' ? user.id : (parsed.barberId === undefined ? current.barberId : parsed.barberId)
    if (!nextBarberId) throw new AppointmentRuleError('Selecione um barbeiro para o agendamento.')
    const barber = await prisma.user.findUnique({ where: { id: nextBarberId } })
    if (!barber) throw new AppointmentRuleError('Barbeiro não encontrado.')

    const nextDate = parsed.date
      ? parseIncomingAppointmentDate(parsed.date)
      : current.date
    if (Number.isNaN(nextDate.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')

    if (hasScheduleChange && nextStatus !== 'CANCELED') {
      validateAppointmentSchedule(nextDate, nextTotals.durationMins, !isAdmin)
      const conflicts = await prisma.appointment.findMany({
        where: { id: { not: id }, barberId: nextBarberId, status: { not: 'CANCELED' } },
        include: { service: { select: { durationMins: true } }, appointmentServices: { select: { durationMins: true } } },
      })
      const nextEnd = nextDate.getTime() + nextTotals.durationMins * 60_000
      if (!isAdmin && conflicts.some((appointment) => {
        const duration = appointment.appointmentServices.length
          ? appointment.appointmentServices.reduce((total, item) => total + item.durationMins, 0)
          : appointment.service.durationMins
        const appointmentEnd = appointment.date.getTime() + duration * 60_000
        return nextDate.getTime() < appointmentEnd && nextEnd > appointment.date.getTime()
      })) {
        throw new AppointmentRuleError('Esse horário não está mais disponível para o barbeiro selecionado.')
      }
    }

    const mudouHorario = current.date.getTime() !== nextDate.getTime()

    const data: Prisma.AppointmentUpdateInput = {
      client: parsed.clientId ? { connect: { id: nextClientId } } : undefined,
      service: hasServiceChange ? { connect: { id: nextService.id } } : undefined,
      appointmentServices: hasServiceChange
        ? { deleteMany: {}, create: appointmentServiceCreateData(nextServices) }
        : undefined,
      barber: { connect: { id: nextBarberId } },
      date: nextDate,
      notes: parsed.notes,
      status: nextStatus,
      ...(mudouHorario && { reminderSent: false }),
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, service: true, appointmentServices: { include: { service: true } } },
    })

    // Enviar mensagem para o cliente quando for CONFIRMADO
    if (current.status !== 'CONFIRMED' && nextStatus === 'CONFIRMED') {
      try {
        const { resolvePhone } = await import('@/lib/notifications')
        const targetPhone = resolvePhone(appointment.client.phone);
        
        if (targetPhone) {
          const number = normalizeBrazilPhone(targetPhone);
          if (!number) {
            console.error(`[Appointments PATCH] Invalid target phone for ${appointment.client.id}`);
          } else {
            // Formatar data e hora usando fuso horário correto
            const formatter = new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Porto_Velho',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            });
            const parts = formatter.formatToParts(new Date(appointment.date));
            const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
            const dataFormatada = `${p.weekday}, ${p.day} de ${p.month} às ${p.hour}:${p.minute}`;
            
            const serviceNames = appointment.appointmentServices.length
              ? appointment.appointmentServices.map((item) => item.service.name).join(', ')
              : appointment.service.name
            const msg = `Olá, ${appointment.client.name}! Tudo bem?\n\nPassando para confirmar o seu agendamento de *${serviceNames}*.\n\n📅 Data: ${dataFormatada}\n\nSeu horário está confirmadíssimo! Te esperamos na barbearia. 💈✂️`;
            
            await sendTextMessage(number, msg).catch(e => console.error('WhatsApp client msg error:', e));
          }
        }

        // Disparar Evento para Webhook (Fire-and-forget)
        import('crypto').then(({ randomUUID }) => {
          const eventId = randomUUID();
          import('@/lib/events').then(({ dispatchWebhookEvent }) => {
            dispatchWebhookEvent({
              eventId,
              event: 'appointment.confirmed',
              occurredAt: new Date().toISOString(),
              data: {
                appointment: {
                  id: appointment.id,
                  date: appointment.date.toISOString(),
                  status: appointment.status,
                  totalPrice: Number(nextTotals.price),
                  durationMins: nextTotals.durationMins,
                  notes: appointment.notes
                },
                client: {
                  id: appointment.client.id,
                  name: appointment.client.name,
                  phone: appointment.client.phone
                },
                barber: {
                  id: barber.id,
                  name: barber.name,
                  phone: barber.phone || ''
                },
                services: nextServices.map(s => ({ id: s.id, name: s.name }))
              }
            });
          });
        });
      } catch (e) {
        console.error('Error with WA client notification:', e);
      }
    }

    // Auto-create income transaction when completed
    if (current.status !== 'COMPLETED' && nextStatus === 'COMPLETED') {
      const appt = await prisma.appointment.findUnique({
        where: { id },
        include: { service: true, appointmentServices: { include: { service: true } }, client: true },
      })
      if (appt) {
        const newTx = await prisma.transaction.upsert({
          where: { appointmentId: id },
          update: {},
          create: {
            type: 'INCOME',
            amount: getAppointmentServiceTotals(appt).price,
            description: `${(appt.appointmentServices.length ? appt.appointmentServices.map((item) => item.service.name).join(', ') : appt.service.name)} — ${appt.client.name}`,
            category: 'Service',
            appointmentId: id,
            date: new Date(),
          },
        })

        const adminPhone = process.env.ADMIN_PHONE || '5569999630329';
        const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTx.amount)
        const msgToAdmin = `💰 *Serviço Concluído*\n\nTipo: Receita\nValor: ${formattedAmount}\nDescrição: ${newTx.description}\nCategoria: ${newTx.category}`
        await sendTextMessage(adminPhone, msgToAdmin).catch((error) => console.error('WhatsApp admin message error:', error))

        // Notify client about completion
        const { resolvePhone } = await import('@/lib/notifications')
        const targetClientPhone = resolvePhone(appt.client.phone);
        if (targetClientPhone) {
           const number = normalizeBrazilPhone(targetClientPhone);
           if (number) {
             const msgToClient = `✅ *Atendimento Concluído*\n\nOlá, ${appt.client.name}! Seu atendimento foi finalizado.\n\nMuito obrigado pela preferência! Esperamos ver você novamente em breve. 💈✂️`;
             await sendTextMessage(number, msgToClient).catch(e => console.error('WhatsApp client completion error:', e));
           }
        }

        // Disparar Evento para Webhook (Fire-and-forget)
        import('crypto').then(({ randomUUID }) => {
          const eventId = randomUUID();
          import('@/lib/events').then(({ dispatchWebhookEvent }) => {
            dispatchWebhookEvent({
              eventId,
              event: 'finance.transaction.created',
              occurredAt: new Date().toISOString(),
              data: {
                transaction: {
                  id: newTx.id,
                  amount: Number(newTx.amount),
                  type: newTx.type,
                  description: newTx.description,
                  category: newTx.category
                }
              }
            });
          });
        });
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[Appointments PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof AppointmentRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  return NextResponse.json(
    { error: 'Agendamentos não podem ser excluídos. Altere o status para CANCELED para preservar o histórico.' },
    { status: 409 },
  )
}
