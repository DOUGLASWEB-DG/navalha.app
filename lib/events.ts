// lib/events.ts
const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || '';

export type AppointmentCreatedPayload = {
  event: 'appointment.created';
  appointmentId: string;
  status: string;
  client: {
    name: string;
    phone: string;
  };
  barber: {
    id: string;
    name: string;
  };
  appointment: {
    date: string;
    dateFormatted: string;
    timeFormatted: string;
    services: string[];
    totalDurationMins: number;
    totalPrice: number;
    notes?: string;
  };
};

export async function dispatchWebhookEvent(payload: AppointmentCreatedPayload) {
  if (!WEBHOOK_URL) {
    console.warn('[Events] N8N_WEBHOOK_URL não configurada. Evento ignorado:', payload.event);
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (WEBHOOK_SECRET) {
      headers['Authorization'] = `Bearer ${WEBHOOK_SECRET}`;
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[Events] Falha ao enviar evento ${payload.event}. Status: ${response.status}`);
      // Não lançamos erro para não quebrar a transação já efetuada.
    } else {
      console.log(`[Events] Evento ${payload.event} enviado com sucesso para o webhook.`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Events] Timeout ao tentar enviar evento ${payload.event}. O webhook demorou mais de 5s.`);
    } else {
      console.error(`[Events] Erro de comunicação ao enviar evento ${payload.event}:`, error.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
