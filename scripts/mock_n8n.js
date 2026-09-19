const http = require('http');

const PORT = 8081;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('--- RECEBIDO NO WEBHOOK FALSO ---');
      console.log('Headers:', req.headers);
      console.log('Payload:', JSON.stringify(JSON.parse(body), null, 2));
      console.log('---------------------------------');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Webhook recebido com sucesso' }));
      process.exit(0);
    });
  } else {
    res.writeHead(405);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`[Mock Webhook] Rodando em http://localhost:${PORT}`);
});
