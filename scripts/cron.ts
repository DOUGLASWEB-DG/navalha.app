import { PrismaClient } from '@prisma/client';
import { format, addHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'dotenv/config';
import { normalizeBrazilPhone } from '../lib/format';

const prisma = new PrismaClient();
const EVO_URL = process.env.NEXT_PUBLIC_EVO_URL || 'http://localhost:8080';
const EVO_API_KEY = process.env.EVO_API_KEY || 'barberos_whatsapp_key';
const INSTANCE_NAME = 'barberos_main';

async function sendTextMessage(number: string, text: string) {
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
    });
    return response.json();
  } catch (error) {
    console.error('❌ Erro no envio da mensagem Evolution API:', error);
  }
}

async function checkReminders() {
  console.log(`[Cron] Checando agendamentos para lembretes... (${new Date().toLocaleString()})`);
  
  try {
    // Buscar agendamentos que estão marcados para CONFIRMED, que não enviou lembrete ainda, e que são hoje.
    const now = new Date();
    // Janela: Daqui a 0 até 70 minutos.
    const upperLimit = addHours(now, 1.2); // + 1 hora e 12 minutos
    const lowerLimit = now;

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSent: false,
        date: {
          gte: lowerLimit,
          lte: upperLimit,
        }
      },
      include: {
        client: true,
        service: true,
        appointmentServices: { include: { service: true } },
      }
    });

    for (const appt of appointments) {
      const minsDiff = differenceInMinutes(new Date(appt.date), now);
      
      // Se faltar entre 30 a 70 minutos (1 hora em média), enviamos.
      if (minsDiff <= 70 && minsDiff >= 30) {
        let phone = appt.client.phone;
        if (phone) {
          phone = normalizeBrazilPhone(phone) || '';
          if (!phone) continue;

          const timeFormatted = format(new Date(appt.date), "HH:mm", { locale: ptBR });
          const serviceNames = appt.appointmentServices.length
            ? appt.appointmentServices.map((item) => item.service.name).join(', ')
            : appt.service.name;
          const msgToClient = `⏰ *Lembrete de Agendamento*\n\nOlá, ${appt.client.name}! Tudo bem?\nPassando para confirmar o seu horário marcado para hoje às *${timeFormatted}*.\n\n💈 Serviço(s): ${serviceNames}\n\nAguardamos você na barbearia!`;
          console.log(`[Cron] Enviando lembrete para ${appt.client.name} (${phone}) - Faltam ${minsDiff} minutos`);
          await sendTextMessage(phone, msgToClient);

          const msgToBarber = `💈 *Lembrete (Barbeiro)*\n\nO cliente ${appt.client.name} tem um horário agendado em breve (às *${timeFormatted}*).\n\nServiço(s): ${serviceNames}\nContato: ${phone}`;
          await sendTextMessage('5569999630329', msgToBarber);

          // Atualizar no DB para não mandar de novo
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSent: true }
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro no Cron de Lembretes:', error);
  }
}

// Inicia o cron
console.log('🚀 Robô de Lembretes Automáticos iniciado! (Verificando a cada 5 minutos)');
// Executa na hora que liga
checkReminders();
// Depois a cada 5 minutos
setInterval(checkReminders, 5 * 60 * 1000);
