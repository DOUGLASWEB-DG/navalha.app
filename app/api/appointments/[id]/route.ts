import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { sendTextMessage } from '@/lib/whatsapp'
import { normalizeBrazilPhone } from '@/lib/format'
import { Prisma } from '@prisma/client'
import { notFound, requireTenantUser, requirePermission, tenantErrorResponse } from '@/lib/api'
import {
  AppointmentRuleError,
  assertStatusTransition,
  parseIncomingAppointmentDate,
  validateAppointmentSchedule,
} from '@/lib/appointment-rules'
import {
  appointmentServiceCreateData,
  getActiveServices,
  getAppointmentServiceSummary,
  getAppointmentServiceTotals,
  getServiceTotals,
  normalizeServiceIds,
} from '@/lib/appointment-services'

const updateSchema = z.object({
  clientId: z.string().max(LIMITES.id).optional(),
  serviceIds: z.array(z.string().min(1).max(LIMITES.id)).min(1).max(LIMITES.ids).optional(),
  serviceId: z.string().min(1).max(LIMITES.id).optional(),
  barberId: z.string().max(LIMITES.id).nullable().optional(),
  clientPackageId: z.string().max(LIMITES.id).nullable().optional(),
  date: z.string().max(LIMITES.data).optional(),
  notes: z.string().max(LIMITES.notas).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantUser()
    const { user, barbearia } = session
    const barbeariaId = barbearia.id
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    // Agendamento de outra barbearia: 404, igual a inexistente
    const current = await prisma.appointment.findFirst({
      where: { id, barbeariaId },
      include: { service: true, appointmentServices: { include: { service: true } }, client: true },
    })
    if (!current) throw notFound('Agendamento não encontrado.')
    if (user.role === 'BARBER' && current.barberId !== user.id) {
      return NextResponse.json({ error: 'Você não pode alterar este agendamento.' }, { status: 403 })
    }

    const isAdmin = user.role === 'ADMIN'
    const permissionChangesSchedule = ['clientId', 'serviceIds', 'serviceId', 'barberId', 'clientPackageId', 'date', 'notes'].some(key => Object.prototype.hasOwnProperty.call(parsed, key))
    if (permissionChangesSchedule) await requirePermission(session, 'appointments.edit')
    if (parsed.status && parsed.status !== current.status) {
      const permission = { CONFIRMED: 'appointments.confirm', COMPLETED: 'appointments.complete', CANCELED: 'appointments.cancel', PENDING: 'appointments.edit' } as const
      await requirePermission(session, permission[parsed.status])
    }
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
      ? await getActiveServices(barbeariaId, normalizeServiceIds(parsed.serviceIds, parsed.serviceId))
      : currentServices
    const nextService = nextServices[0]
    const nextTotals = getServiceTotals(nextServices)

    const nextClientId = parsed.clientId ?? current.clientId
    if (parsed.clientId) {
      const client = await prisma.client.findFirst({ where: { id: nextClientId, barbeariaId } })
      if (!client || !client.isActive) throw notFound('Cliente não encontrado ou inativo.')
    }

    const nextBarberId = user.role === 'BARBER' ? user.id : (parsed.barberId === undefined ? current.barberId : parsed.barberId)
    if (!nextBarberId) throw new AppointmentRuleError('Selecione um barbeiro para o agendamento.')
    const barber = await prisma.user.findFirst({ where: { id: nextBarberId, barbeariaId } })
    if (!barber) throw notFound('Barbeiro não encontrado.')
    // Agendamento antigo de barbeiro desativado continua editável (ex.: concluir); só não pode ser transferido a ele.
    if (!barber.active && nextBarberId !== current.barberId) throw new AppointmentRuleError('Barbeiro desativado.')

    const nextDate = parsed.date
      ? parseIncomingAppointmentDate(parsed.date, barbearia.timezone)
      : current.date
    if (Number.isNaN(nextDate.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')

    if (hasScheduleChange && nextStatus !== 'CANCELED') {
      validateAppointmentSchedule(nextDate, nextTotals.durationMins, barbearia.timezone, !isAdmin)
      const conflicts = await prisma.appointment.findMany({
        where: { id: { not: id }, barbeariaId, barberId: nextBarberId, status: { not: 'CANCELED' } },
        include: { service: { select: { price: true, durationMins: true } }, appointmentServices: { select: { price: true, durationMins: true } } },
      })
      const nextEnd = nextDate.getTime() + nextTotals.durationMins * 60_000
      if (!isAdmin && conflicts.some((appointment) => {
        const duration = getAppointmentServiceTotals(appointment).durationMins
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
      clientPackage: parsed.clientPackageId !== undefined
        ? (parsed.clientPackageId ? { connect: { id: parsed.clientPackageId } } : { disconnect: true })
        : undefined,
      ...(mudouHorario && { reminderSent: false }),
    }

    const appointment = await prisma.appointment.update({
      where: { id, barbeariaId },
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
              timeZone: barbearia.timezone,
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            });
            const parts = formatter.formatToParts(new Date(appointment.date));
            const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
            const dataFormatada = `${p.weekday}, ${p.day} de ${p.month} às ${p.hour}:${p.minute}`;
            
            const serviceNames = getAppointmentServiceSummary(appointment).namesJoined
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

    // Auto-create income transaction & compute commissions when completed
    if (current.status !== 'COMPLETED' && nextStatus === 'COMPLETED') {
      const appt = await prisma.appointment.findFirst({
        where: { id, barbeariaId },
        include: {
          service: true,
          appointmentServices: { include: { service: true } },
          client: true,
          clientPackage: { include: { package: true } },
          barber: true,
        },
      })
      if (appt) {
        const commPercent = appt.barber?.commissionPercent ?? 50.0
        let isFromPackage = false
        let isLastCut = false
        let remainingCuts = 0
        let packageName = ''
        let newTx: any = null

        // Se o agendamento foi coberto por um pacote
        if (appt.clientPackage && appt.clientPackage.status === 'ACTIVE') {
          isFromPackage = true
          packageName = appt.clientPackage.package.name
          const nextUsed = appt.clientPackage.usedCuts + 1
          isLastCut = nextUsed >= appt.clientPackage.totalCuts
          remainingCuts = Math.max(0, appt.clientPackage.totalCuts - nextUsed)

          // Atualiza uso do pacote
          await prisma.clientPackage.update({
            where: { id: appt.clientPackage.id },
            data: {
              usedCuts: nextUsed,
              status: isLastCut ? 'COMPLETED' : 'ACTIVE',
            },
          })

          // Comissão baseada no valor unitário do corte no pacote
          const unitCutPrice = appt.clientPackage.package.price / appt.clientPackage.totalCuts
          const commAmount = Math.round(unitCutPrice * (commPercent / 100) * 100) / 100

          await prisma.appointment.update({
            where: { id, barbeariaId },
            data: {
              commissionPercent: commPercent,
              commissionAmount: commAmount,
            },
          })
        } else {
          // Atendimento avulso normal
          const servicePrice = getAppointmentServiceTotals(appt).price
          const commAmount = Math.round(servicePrice * (commPercent / 100) * 100) / 100

          await prisma.appointment.update({
            where: { id, barbeariaId },
            data: {
              commissionPercent: commPercent,
              commissionAmount: commAmount,
            },
          })

          newTx = await prisma.transaction.upsert({
            where: { appointmentId: id },
            update: {},
            create: {
              barbeariaId: appt.barbeariaId,
              type: 'INCOME',
              amount: servicePrice,
              description: `${getAppointmentServiceSummary(appt).namesJoined} — ${appt.client.name}`,
              category: 'Service',
              appointmentId: id,
              date: new Date(),
            },
          })

          const adminPhone = process.env.ADMIN_PHONE
          const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTx.amount)
          const msgToAdmin = `💰 *Serviço Concluído*\n\nTipo: Receita\nValor: ${formattedAmount}\nDescrição: ${newTx.description}\nCategoria: ${newTx.category}`
          if (adminPhone) {
            await sendTextMessage(adminPhone, msgToAdmin).catch((error) => console.error('WhatsApp admin message error:', error))
          }
        }

        // Notificação de conclusão ao Cliente via WhatsApp
        const { resolvePhone } = await import('@/lib/notifications')
        const targetClientPhone = resolvePhone(appt.client.phone)
        if (targetClientPhone) {
          const number = normalizeBrazilPhone(targetClientPhone)
          if (number) {
            let msgToClient = ''
            if (isFromPackage) {
              if (isLastCut) {
                msgToClient = `💈 *Atendimento Concluído!*\n\nOlá, *${appt.client.name}*! Seu corte foi finalizado com sucesso.\n\n⚠️ *Aviso Importante:* Este foi o *ÚLTIMO CORTE* do seu pacote *${packageName}*!\n\nEntre em contato com o Mateus ou seu barbeiro para renovar seu pacote e garantir o seu desconto para o próximo mês! 👊✂️`
              } else {
                msgToClient = `✅ *Atendimento Concluído!*\n\nOlá, *${appt.client.name}*! Seu corte foi finalizado.\n\n✂️ Você utilizou 1 corte do pacote *${packageName}*. Restam *${remainingCuts} cortes* disponíveis.\n\nMuito obrigado pela preferência! 💈`
              }
            } else {
              msgToClient = `✅ *Atendimento Concluído*\n\nOlá, ${appt.client.name}! Seu atendimento foi finalizado.\n\nMuito obrigado pela preferência! Esperamos ver você novamente em breve. 💈✂️`
            }
            await sendTextMessage(number, msgToClient).catch((e) => console.error('WhatsApp client completion error:', e))
          }
        }

        // Disparar Evento para Webhook (Fire-and-forget)
        if (newTx) {
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
    }

    return NextResponse.json(appointment)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
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

// Não consulta o id: a resposta é a mesma para qualquer agendamento, de qualquer barbearia.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTenantUser()
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    throw error
  }
  return NextResponse.json(
    { error: 'Agendamentos não podem ser excluídos. Altere o status para CANCELED para preservar o histórico.' },
    { status: 409 },
  )
}
