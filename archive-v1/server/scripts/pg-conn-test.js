const { Client } = require('pg');

async function test() {
  const configs = [
    { name: 'localhost:5432 (WSL2 proxy)', host: 'localhost', port: 5432, user: 'postgres', password: 'timeslots_dev', database: 'timeslots_dev' },
  ];
  for (const c of configs) {
    const client = new Client(c);
    try {
      await client.connect();
      const r = await client.query('SELECT version()');
      console.log(`✅ ${c.name}: ${r.rows[0].version}`);
      await client.end();
      return;
    } catch (e) {
      console.log(`❌ ${c.name}: ${e.message}`);
    }
  }
  console.log('\n=== Try via WSL2 eth0 IP ===');
  const { execSync } = require('child_process');
  try {
    const ip = execSync('wsl -d Ubuntu-26.04 -- bash -c "hostname -I | awk \'{print $1}\'"', { encoding: 'utf8' }).trim();
    console.log('WSL2 IP:', ip);
    const c2 = new Client({ host: ip, port: 5432, user: 'postgres', password: 'timeslots_dev', database: 'timeslots_dev' });
    await c2.connect();
    const r2 = await c2.query('SELECT version()');
    console.log(`✅ via ${ip}: ${r2.rows[0].version}`);
    await c2.end();
  } catch (e) {
    console.log('❌ via WSL2 IP:', e.message);
  }
}
test();
