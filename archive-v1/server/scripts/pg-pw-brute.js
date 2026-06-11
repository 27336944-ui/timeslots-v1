const { Client } = require('pg');

(async () => {
  // Try common default passwords
  const passwords = ['', 'postgres', 'Postgres123', 'timeslots_dev', 'admin', 'password'];
  for (const pw of passwords) {
    const c = new Client({
      host: 'localhost', port: 5432, user: 'postgres', password: pw, database: 'postgres', connectionTimeoutMillis: 2000,
    });
    try {
      await c.connect();
      console.log(`✅ password = '${pw}'`);
      const r = await c.query('SELECT version()');
      console.log('   version:', r.rows[0].version.split(',')[0]);
      await c.end();
      return pw;
    } catch (e) {
      console.log(`❌ '${pw}': ${e.code}`);
    }
  }
})();
