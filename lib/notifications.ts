import { sendTextMessage } from '@/lib/whatsapp'
import { dispatchWebhookEvent } from '@/lib/events'

export interface NotificationPayload {
  appointment: { id: string; date: Date | string; status: string; notes?: string | null }
  client: { id: string; name: string; phone: string }
  barber?: { id: string; name: string; phone?: string | null } | null
  services: { id: string; name: string; durationMins: number; price: number }[]
  totalPrice: number
  totalDurationMins: number
}

export async function notifyAppointmentCreated(payload: NotificationPayload) {
  const { appointment, client, barber, services, totalPrice, totalDurationMins } = payload
  
  const datetime = typeof appointment.date === 'string' ? new Date(appointment.date) : appointment.date
  
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Porto_Velho',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  const parts = formatter.formatToParts(datetime)
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const timeFormatted = `${p.hour}:${p.minute}`
  const dateFormatted = `${p.day}/${p.month}/${p.year}`
  
  const serviceNames = services.map(s => s.name).join(', ')

  // --- HOMOLOGATION SANDBOX ---
  let targetClientPhone: string | undefined = client.phone
  let targetBarberPhone: string | undefined = barber?.phone

  const isSandboxEnabled = process.env.ENABLE_WHATSAPP_SANDBOX === 'true'
  const sandboxPhone = process.env.TEST_OVERRIDE_PHONE

  if (isSandboxEnabled) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Sandbox] ERRO CRÍTICO: Sandbox ativado em PRODUÇÃO! Para proteger os clientes, TODAS as mensagens WhatsApp foram canceladas nesta requisição.')
      targetClientPhone = undefined
      targetBarberPhone = undefined
    } else if (!sandboxPhone) {
      console.error('[Sandbox] ERRO: ENABLE_WHATSAPP_SANDBOX ativo, mas TEST_OVERRIDE_PHONE ausente. Para evitar envios acidentais, as mensagens foram canceladas.')
      targetClientPhone = undefined
      targetBarberPhone = undefined
    } else {
      targetClientPhone = sandboxPhone
      targetBarberPhone = sandboxPhone
      console.log(`[Sandbox] ATIVO: Destinatários reais preservados. Redirecionando para ${sandboxPhone}`)
    }
  }

  // 1. WhatsApp Evolution API (Mensagem Direta)
  if (targetClientPhone) {
    const msgToClient = `✂️ *Agendamento Recebido!*\n\nOlá, ${client.name}!\nSeu horário está agendado.\n\n📅 Data: ${dateFormatted}\n⏰ Horário: ${timeFormatted}\n💈 Serviço(s): ${serviceNames}\n\nAgradecemos a preferência e aguardamos você!`
    sendTextMessage(targetClientPhone, msgToClient).catch(console.error)
  }

  if (targetBarberPhone) {
    const msgToBarber = `💈 *Novo Agendamento!*\n\nO cliente ${client.name} acabou de marcar um horário.\n\n📅 Data: ${dateFormatted}\n⏰ Horário: ${timeFormatted}\n💈 Serviço(s): ${serviceNames}\n📱 Contato: ${client.phone}`
    sendTextMessage(targetBarberPhone, msgToBarber).catch(console.error)
  }

  // 2. n8n Webhook (Evento de Domínio)
  const crypto = await import('crypto')
  const eventId = crypto.randomUUID()
  
  dispatchWebhookEvent({
    eventId,
    event: 'appointment.created',
    occurredAt: new Date().toISOString(),
    data: {
      appointment: {
        id: appointment.id,
        date: datetime.toISOString(),
        status: appointment.status,
        totalPrice: Number(totalPrice),
        durationMins: totalDurationMins,
        notes: appointment.notes
      },
      client: { id: client.id, name: client.name, phone: client.phone },
      barber: barber ? { id: barber.id, name: barber.name, phone: barber.phone || '' } : null,
      services: services.map(s => ({ id: s.id, name: s.name }))
    }
  })
}
