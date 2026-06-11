const { Client } = require('pg');
const c = new Client({
  host: '172.23.98.238',
  port: 5432,
  user: 'postgres',
  password: 'timeslots_dev',
  database: 'timeslots_dev',
  connectionTimeoutMillis: 3000,
  ssl: false,
});
c.on('error', (e) => console.log('EVENT ERR:', e.message));
c.on('connect', () => console.log('EVENT CONNECT'));
c.on('end', () => console.log('EVENT END'));
c.connect()
  .then(() => {
    console.log('CONNECTED OK');
    return c.query('SELECT 1');
  })
  .then(r => { console.log('QUERY OK:', r.rows); return c.end(); })
  .catch(e => {
    console.log('CATCH:', e.code, e.message);
    console.log('Stack:', e.stack);
  });
