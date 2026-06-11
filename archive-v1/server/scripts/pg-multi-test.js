const { Client } = require('pg');

async function test(host) {
  const c = new Client({
    host,
    port: 5432,
    user: 'postgres',
    password: 'timeslots_dev',
    database: 'postgres',  // connect to default db first
    connectionTimeoutMillis: 3000,
  });
  try {
    await c.connect();
    const r = await c.query('SELECT version()');
    console.log(`✅ ${host}:`, r.rows[0].version.slice(0, 40));
    await c.end();
    return true;
  } catch (e) {
    console.log(`❌ ${host}:`, e.code, e.message);
    return false;
  }
}

(async () => {
  await test('127.0.0.1');
  await test('10.57.104.67');
  await test('172.23.98.238');
})();
