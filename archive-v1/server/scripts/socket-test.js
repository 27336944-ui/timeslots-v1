const net = require('net');
const hosts = process.argv.slice(2);
if (hosts.length === 0) hosts.push('127.0.0.1');

(async () => {
  for (const host of hosts) {
    await new Promise((resolve) => {
      const c = net.createConnection({ host, port: 5432, timeout: 3000 });
      const t = setTimeout(() => { console.log(`TIMEOUT ${host}:5432`); c.destroy(); resolve(); }, 4000);
      c.on('connect', () => { clearTimeout(t); console.log(`CONNECTED ${host}:5432`); c.end(); resolve(); });
      c.on('error', (e) => { clearTimeout(t); console.log(`ERR ${host}:5432: ${e.message}`); resolve(); });
    });
  }
})();

