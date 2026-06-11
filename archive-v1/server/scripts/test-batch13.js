const http = require('http');
const base = { hostname: 'localhost', port: 7777, headers: { 'Content-Type': 'application/json' } };
const auth = { Authorization: 'Bearer 11111111-1111-1111-1111-111111111111' };

function test(method, path, headers, body) {
  return new Promise(resolve => {
    const opts = { ...base, path, method, headers: { ...base.headers, ...headers } };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`[${method} ${path}] HTTP ${res.statusCode}`);
        try { const j = JSON.parse(data); console.log(JSON.stringify(j, null, 2)); } catch { console.log(data); }
        console.log('---');
        resolve();
      });
    });
    req.on('error', e => { console.log(`[${method} ${path}] ERROR: ${e.message}`); resolve(); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  await test('GET', '/api/v1/health');
  await test('GET', '/api/v1/circles/my', auth);
  await test('POST', '/api/v1/circles', auth, { name: '家人', description: '我的家庭圈子' });
  await test('POST', '/api/v1/circles', auth, { name: '同事', description: '工作圈子' });
  await test('GET', '/api/v1/circles/my', auth);
  await test('GET', '/api/v1/time-blocks/my', auth);
})();
