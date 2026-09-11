const EVO_URL = process.env.NEXT_PUBLIC_EVO_URL || 'http://localhost:8080';
const EVO_API_KEY = process.env.EVO_API_KEY || 'barberos_whatsapp_key';
const INSTANCE_NAME = 'barberos_main';

export async function createInstance() {
  const response = await fetch(`${EVO_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVO_API_KEY,
    },
    body: JSON.stringify({
      instanceName: INSTANCE_NAME,
      token: 'barberos_token',
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    }),
  });
  return response.json();
}

export async function fetchConnectionStatus() {
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
  const response = await fetch(`${EVO_URL}/instance/connect/${INSTANCE_NAME}`, {
    method: 'GET',
    headers: {
      apikey: EVO_API_KEY,
    },
  });
  return response.json();
}

export async function sendTextMessage(number: string, text: string) {
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
