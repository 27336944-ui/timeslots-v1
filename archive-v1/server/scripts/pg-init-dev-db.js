const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'timeslots_dev',
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  try {
    await c.connect();
    console.log('connected');
    await c.query("ALTER USER postgres WITH PASSWORD 'timeslots_dev'");
    console.log('password set');
    const r = await c.query("SELECT 1 FROM pg_database WHERE datname = 'timeslots_dev'");
    if (r.rowCount === 0) {
      await c.query('CREATE DATABASE timeslots_dev');
      console.log('DB timeslots_dev created');
    } else {
      console.log('DB timeslots_dev already exists');
    }
    await c.end();

    const c2 = new Client({
      host: 'localhost', port: 5432, user: 'postgres', password: 'timeslots_dev', database: 'timeslots_dev',
    });
    await c2.connect();
    const rs = await c2.query('SELECT current_database()');
    console.log('timeslots_dev active:', rs.rows[0].current_database);
    await c2.end();
  } catch (e) {
    console.log('FAIL:', e.code, e.message);
    process.exit(1);
  }
})();
