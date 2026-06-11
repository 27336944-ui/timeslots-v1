const { Client } = require('pg');

(async () => {
  // Try sspi auth (Windows integrated)
  const c = new Client({
    host: 'localhost', port: 5432, user: 'postgres', database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  c.on('error', e => console.log('event error:', e.message));
  try {
    await c.connect();
    console.log('connected (sspi?)');
    const r = await c.query('SELECT current_user, session_user');
    console.log('user:', r.rows[0]);
    await c.end();
  } catch (e) {
    console.log('FAIL:', e.code, e.message);
  }
})();
