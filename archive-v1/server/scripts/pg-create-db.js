const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432, user: 'postgres', password: 'timeslots_dev',
});
(async () => {
  try {
    await c.connect();
    const r = await c.query("SELECT datname FROM pg_database WHERE datname = 'timeslots_dev'");
    if (r.rowCount === 0) {
      console.log('timeslots_dev missing, creating...');
      await c.query('CREATE DATABASE timeslots_dev');
      console.log('created');
    } else {
      console.log('timeslots_dev exists');
    }
    const r2 = await c.query("SELECT current_database()");
    await c.end();
    const c2 = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'timeslots_dev', database: 'timeslots_dev' });
    await c2.connect();
    const r3 = await c2.query("SELECT current_database()");
    console.log('connect timeslots_dev OK:', r3.rows[0].current_database);
    await c2.end();
  } catch (e) {
    console.log('FAIL:', e.code, e.message);
  }
})();
