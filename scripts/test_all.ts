import { dispatchWebhookEvent } from '../lib/events';
import http from 'http';
import { prisma } from '../lib/prisma';

// 1. Force the env vars for the script (NOTE: For the real flow test, the Next.js server will use its own env vars)
process.env.N8N_WEBHOOK_URL = 'http://localhost:8081';
process.env.N8N_WEBHOOK_SECRET = 'secret-123';

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  console.log('=============================================');
  console.log('TEST 1: ISOLATED DISPATCHER WITH MOCK');
  console.log('=============================================');
  
  const mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('\n[Mock Server] Received Webhook POST');
      console.log('[Mock Server] Headers Authorization:', req.headers.authorization);
      console.log('[Mock Server] Body:', JSON.stringify(JSON.parse(body), null, 2));
      res.writeHead(200); res.end('OK');
    });
  });
  
  mockServer.listen(8081);
  await sleep(500);

  await dispatchWebhookEvent({
     eventId: 'mock-123',
     event: 'appointment.created',
     occurredAt: new Date().toISOString(),
     data: {
       appointment: {
         id: 'mock-123',
         date: new Date().toISOString(),
         status: 'PENDING',
         totalDurationMins: 30,
         totalPrice: 50,
         notes: 'test notes'
       },
       client: { id: 'client-1', name: 'Test Client', phone: '5511999999999' },
       barber: { id: 'barber-1', name: 'Barber Name', phone: '' },
       services: [{ id: 'svc-1', name: 'Corte' }]
     }
  });
  
  await sleep(1000);
  mockServer.close();

  console.log('\n=============================================');
  console.log('TEST 2: ISOLATED DISPATCHER WITHOUT MOCK (FAILURE)');
  console.log('=============================================');
  
  // mock server is closed now
  await dispatchWebhookEvent({
     eventId: 'mock-fail',
     event: 'appointment.created',
     occurredAt: new Date().toISOString(),
     data: {
       appointment: { id: 'mock-fail', date: new Date().toISOString(), status: 'PENDING', totalDurationMins: 0, totalPrice: 0, notes: '' },
       client: { id: 'client-2', name: 'Fail Client', phone: '5511999999999' },
       barber: { id: 'barber-1', name: 'Barber Name', phone: '' },
       services: []
     }
  });
  console.log('[Test 2] Process survived the failure gracefully!');

  console.log('\n=============================================');
  console.log('TEST 3: REAL FLOW VIA /API/BOOK');
  console.log('=============================================');
  
  mockServer.listen(8081);
  await sleep(500);

  const service = await prisma.service.findFirst({ where: { active: true } });
  const barber = await prisma.user.findFirst();
  if (!service || !barber) {
    console.error("Missing service or barber in DB");
    return;
  }

  const reqBody = {
     name: "Integration Test User",
     phone: "69888888888",
     serviceIds: [service.id],
     barberId: barber.id,
     date: "2027-11-20",
     time: "08:30",
     notes: "Test Real Flow"
  };

  console.log('Fetching POST http://localhost:3000/api/book ...');
  try {
    const res = await fetch('http://localhost:3000/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    const resData = await res.json();
    console.log('API Response Status:', res.status);
    console.log('API Response Data:', resData);

    await sleep(2000); // allow webhook and WA logic to resolve

    if (resData.success) {
      const appt = await prisma.appointment.findUnique({ where: { id: resData.appointment.id } });
      console.log(`[DB Check] Appointment ${appt?.id} exists in database:`, !!appt);
      
      // Cleanup
      await prisma.appointmentService.deleteMany({ where: { appointmentId: appt!.id } });
      await prisma.appointment.delete({ where: { id: appt!.id } });
      console.log('[DB Check] Test appointment cleaned up.');
    }
  } catch (err: any) {
    console.error('Failed to call API. Make sure Next.js server is running on port 3000. Error:', err.message);
  }

  mockServer.close();
  console.log('\n--- ALL TESTS COMPLETED ---');
}

runTests().catch(console.error);
