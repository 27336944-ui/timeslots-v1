const { Client } = require('pg');
const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'timeslots_dev',
  database: 'postgres',
  connectionTimeoutMillis: 3000,
});
c.connect()
  .then(() => c.query('SELECT current_database(), current_user'))
  .then(r => { console.log('OK:', r.rows[0]); return c.end(); })
  .catch(e => console.log('FAIL:', e.code, e.message));
