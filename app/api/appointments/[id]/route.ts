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

    const nextStatus = parsed.status ?? current.status
    assertStatusTransition(current.status, nextStatus, current.date)
    const hasServiceChange = parsed.serviceIds !== undefined || parsed.serviceId !== undefined
    const hasScheduleChange = parsed.clientId !== undefined || hasServiceChange ||
      parsed.barberId !== undefined || parsed.date !== undefined || parsed.notes !== undefined
    if (hasScheduleChange && (current.status === 'COMPLETED' || current.status === 'CANCELED')) {
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
    const barber = await prisma.user.findFirst({ where: { id: nextBarberId, role: 'BARBER' } })
    if (!barber) throw new AppointmentRuleError('Barbeiro não encontrado.')

    const nextDate = parsed.date
      ? parseIncomingAppointmentDate(parsed.date)
      : current.date
    if (Number.isNaN(nextDate.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')

    if (hasScheduleChange && nextStatus !== 'CANCELED') {
      validateAppointmentSchedule(nextDate, nextTotals.durationMins)
      const conflicts = await prisma.appointment.findMany({
        where: { id: { not: id }, barberId: nextBarberId, status: { not: 'CANCELED' } },
        include: { service: { select: { durationMins: true } }, appointmentServices: { select: { durationMins: true } } },
      })
      const nextEnd = nextDate.getTime() + nextTotals.durationMins * 60_000
      if (conflicts.some((appointment) => {
        const duration = appointment.appointmentServices.length
          ? appointment.appointmentServices.reduce((total, item) => total + item.durationMins, 0)
          : appointment.service.durationMins
        const appointmentEnd = appointment.date.getTime() + duration * 60_000
        return nextDate.getTime() < appointmentEnd && nextEnd > appointment.date.getTime()
      })) {
        throw new AppointmentRuleError('Esse horário não está mais disponível para o barbeiro selecionado.')
      }
    }

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
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, service: true, appointmentServices: { include: { service: true } } },
    })

    // Enviar mensagem para o cliente quando for CONFIRMADO
    if (current.status !== 'CONFIRMED' && nextStatus === 'CONFIRMED') {
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
          
          const serviceNames = appointment.appointmentServices.length
            ? appointment.appointmentServices.map((item) => item.service.name).join(', ')
            : appointment.service.name
          const msg = `Olá, ${appointment.client.name}! Tudo bem?\n\nPassando para confirmar o seu agendamento de *${serviceNames}*.\n\n📅 Data: ${dataFormatada}\n\nSeu horário está confirmadíssimo! Te esperamos na barbearia. 💈✂️`;
          
          await sendTextMessage(number, msg).catch(e => console.error('WhatsApp client msg error:', e));
          }
        }
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

        const ownerNumber = '5569999630329';
        const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTx.amount)
        const msg = `🟢 *Serviço Concluído*\n\nTipo: Receita\nValor: ${formattedAmount}\nDescrição: ${newTx.description}\nCategoria: ${newTx.category}`
        await sendTextMessage(ownerNumber, msg).catch((error) => console.error('WhatsApp message error:', error))
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
