const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/barberos'
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });
