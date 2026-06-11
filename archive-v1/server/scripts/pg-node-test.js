const { Client } = require('pg');

const c = new Client({
  host: '172.23.98.238',
  port: 5432,
  user: 'postgres',
  password: 'timeslots_dev',
  database: 'timeslots_dev',
  connectionTimeoutMillis: 5000,
});
c.connect()
  .then(() => c.query('SELECT version()'))
  .then(r => { console.log('OK:', r.rows[0].version); return c.end(); })
  .catch(e => { console.log('ERR:', e.message); console.log(e); process.exit(1); });
