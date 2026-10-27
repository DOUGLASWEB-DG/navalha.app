import { planoPermite } from './plan';

const INSTANCE_NAME = 'barberos_main';

export class EvolutionConfigError extends Error {}

// Sem valores padrão: chave ou URL ausente deve falhar, nunca cair numa credencial embutida no código.
export function getEvolutionConfig() {
  const url = process.env.NEXT_PUBLIC_EVO_URL;
  const apiKey = process.env.EVO_API_KEY;
  if (!url || !apiKey) {
    throw new EvolutionConfigError('[WhatsApp] NEXT_PUBLIC_EVO_URL e EVO_API_KEY precisam estar configurados.');
  }
  return { url, apiKey };
}

export async function createInstance() {
  const { url: EVO_URL, apiKey: EVO_API_KEY } = getEvolutionConfig();
  const response = await fetch(`${EVO_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVO_API_KEY,
    },
    body: JSON.stringify({
      instanceName: INSTANCE_NAME,
      // Token da instância opcional; se ausente, não é enviado.
      ...(process.env.EVO_INSTANCE_TOKEN && { token: process.env.EVO_INSTANCE_TOKEN }),
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    }),
  });
  return response.json();
}

export async function fetchConnectionStatus() {
  const { url: EVO_URL, apiKey: EVO_API_KEY } = getEvolutionConfig();
  try {
    const response = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        apikey: EVO_API_KEY,
      },
    });
    return response.json();
  } catch (error) {
    return { state: 'DISCONNECTED' };
  }
}

export async function connectInstance() {
  const { url: EVO_URL, apiKey: EVO_API_KEY } = getEvolutionConfig();
  const response = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
    method: 'GET',
    headers: {
      apikey: EVO_API_KEY,
    },
  });
  return response.json();
}

export async function sendTextMessage(number: string, text: string) {
  // Plano sem WhatsApp (Essencial): não envia nada, nem tenta. Não depender só de faltar a configuração da Evolution,
  // que bastaria alguém copiar para a instalação para o número da América passar a falar com os clientes dela.
  if (!planoPermite('whatsapp')) return { skipped: 'plano' as const };
  const { url: EVO_URL, apiKey: EVO_API_KEY } = getEvolutionConfig();
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
}
