import dotenv from 'dotenv';
dotenv.config();

async function testWebhook() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  console.log('🔍 AUDITORIA DE WEBHOOK n8n 🔍');
  console.log('--------------------------------------------------');
  console.log(`URL Configurada no .env: ${webhookUrl}`);
  console.log(`Método: POST`);
  console.log('--------------------------------------------------');

  if (!webhookUrl) {
    console.error('ERRO: A variável N8N_WEBHOOK_URL não está configurada no .env!');
    return;
  }

  const payload = {
    eventId: 'teste-123',
    event: 'appointment.created',
    occurredAt: new Date().toISOString(),
    data: { teste: true }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (webhookSecret) {
    headers['Authorization'] = `Bearer ${webhookSecret}`;
    console.log('Autenticação: Bearer Token configurado.');
  } else {
    console.log('Autenticação: Nenhuma.');
  }

  try {
    console.log('\nEnviando requisição...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log(`\nStatus da Resposta: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Corpo da Resposta: ${responseText}`);

    if (!response.ok) {
      console.log('\n❌ FALHA NO TESTE.');
      if (response.status === 404) {
        console.log('\nPossíveis motivos para o 404 no n8n:');
        console.log('1. A URL que está no .env é diferente da URL que aparece dentro do nó do Webhook no n8n.');
        console.log('2. O nó do n8n está configurado como método GET (verifique se está POST).');
        console.log('3. Você clicou em "Test workflow" mas o n8n perdeu a conexão.');
      }
    } else {
      console.log('\n✅ SUCESSO! O n8n recebeu o evento.');
    }

  } catch (error: any) {
    console.error('\n❌ ERRO DE CONEXÃO:', error.message);
  }
}

testWebhook();
