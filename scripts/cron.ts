// Robô de lembretes: a cada 5 minutos procura agendamentos confirmados que começam daqui a 30-70 minutos e manda
// um lembrete pelo WhatsApp ao cliente e ao barbeiro.
//
// Em produção roda como container próprio com a mesma imagem do app (`node cron.js`, compilado no Dockerfile).
// Local: npm run cron (precisa de NEXT_PUBLIC_EVO_URL e EVO_API_KEY).
import { PrismaClient } from '@prisma/client';
import { addHours, differenceInMinutes } from 'date-fns';
import 'dotenv/config';
import { normalizeBrazilPhone } from '../lib/format';
import { getAppointmentServiceSummary } from '../lib/appointment-services';
import { resolvePhone } from '../lib/notifications';
import { dispatchWebhookEvent } from '../lib/events';
import { DEFAULT_BARBEARIA_ID } from '../lib/tenant-host';

const prisma = new PrismaClient();
const EVO_URL = process.env.NEXT_PUBLIC_EVO_URL ?? '';
const EVO_API_KEY = process.env.EVO_API_KEY ?? '';
const INTERVAL_MS = 5 * 60 * 1000;

// Sem valores padrão: o robô não inicia com credenciais embutidas no código.
if (!EVO_URL || !EVO_API_KEY) {
  console.error('[Cron] NEXT_PUBLIC_EVO_URL e EVO_API_KEY precisam estar configurados. Encerrando.');
  process.exit(1);
}
const INSTANCE_NAME = 'barberos_main';

// true só quando a Evolution aceitou a mensagem. Falha não marca o lembrete como enviado: ele é tentado de novo
// na próxima volta enquanto o agendamento ainda estiver na janela.
async function sendTextMessage(number: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVO_API_KEY,
      },
      body: JSON.stringify({
        number: number,
        text: text,
        delay: 1200,
        presence: 'composing',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) console.error(`[Cron] Evolution recusou o envio (status ${response.status})`);
    return response.ok;
  } catch (error) {
    console.error('[Cron] Erro de comunicação com a Evolution API:', (error as Error).message);
    return false;
  }
}

async function checkReminders() {
  let sentCount = 0
  try {
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        // A instância do WhatsApp é única e pertence à barbearia padrão (mesma regra de requireWhatsappAdmin):
        // lembretes de outra barbearia sairiam pelo número dela.
        barbeariaId: DEFAULT_BARBEARIA_ID,
        status: 'CONFIRMED',
        reminderSent: false,
        deletedAt: null,
        date: {
          gte: now,
          lte: addHours(now, 1.2), // até 1h12 à frente; o envio só acontece entre 30 e 70 minutos
        },
      },
      include: {
        client: true,
        service: true,
        appointmentServices: { include: { service: true } },
        barber: true,
        barbearia: { select: { timezone: true } },
      },
    });

    for (const appt of appointments) {
      const minsDiff = differenceInMinutes(new Date(appt.date), now);
      if (minsDiff > 70 || minsDiff < 30) continue;

      const clientPhone = normalizeBrazilPhone(resolvePhone(appt.client.phone) ?? '');
      if (!clientPhone) continue;

      const timeFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: appt.barbearia.timezone, hour: '2-digit', minute: '2-digit' });
      const timeFormatted = timeFormatter.format(new Date(appt.date));
      const serviceNames = getAppointmentServiceSummary(appt).namesJoined;
      const msgToClient = `⏰ *Lembrete de Agendamento*\n\nOlá, ${appt.client.name}! Tudo bem?\nPassando para confirmar o seu horário marcado para hoje às *${timeFormatted}*.\n\n💈 Serviço(s): ${serviceNames}\n\nAguardamos você na barbearia!`;

      // Log sem nome nem telefone do cliente (dado pessoal): o id do agendamento basta para investigar
      console.log(`[Cron] Lembrete do agendamento ${appt.id} (faltam ${minsDiff} min)`);
      const sent = await sendTextMessage(clientPhone, msgToClient);
      if (!sent) continue;

      const barberPhone = normalizeBrazilPhone(resolvePhone(appt.barber?.phone) ?? '');
      if (barberPhone) {
        const msgToBarber = `💈 *Lembrete (Barbeiro)*\n\nO cliente ${appt.client.name} tem um horário agendado em breve (às *${timeFormatted}*).\n\nServiço(s): ${serviceNames}\nContato: ${appt.client.phone}`;
        await sendTextMessage(barberPhone, msgToBarber);
      }

      // Marca só depois do envio ao cliente: não repete na próxima volta
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true },
      });
      sentCount += 1

      void dispatchWebhookEvent({
        eventId: crypto.randomUUID(),
        event: 'appointment.reminder_due',
        occurredAt: new Date().toISOString(),
        data: {
          appointment: { id: appt.id, date: appt.date.toISOString(), status: appt.status },
          client: { id: appt.client.id, name: appt.client.name, phone: clientPhone },
          barber: appt.barber ? { id: appt.barber.id, name: appt.barber.name, phone: appt.barber.phone || '' } : null,
          services: appt.appointmentServices.length
            ? appt.appointmentServices.map((item) => ({ id: item.service.id, name: item.service.name }))
            : (appt.service ? [{ id: appt.service.id, name: appt.service.name }] : []),
        },
      });
    }
  } catch (error) {
    console.error('[Cron] Erro no ciclo de lembretes:', (error as Error).message);
  }
  // Marca o fim de cada volta (operação e teste automático)
  console.log(`[Cron] Ciclo concluído: ${sentCount} lembrete(s) enviado(s).`);
}

console.log(`[Cron] Robô de lembretes iniciado (verifica a cada ${INTERVAL_MS / 60000} minutos).`);
checkReminders();
setInterval(checkReminders, INTERVAL_MS);
