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
    req.on('error', e => { console.log(`[${method} ${path}] ERROR: ${e.message}`); console.log('---'); resolve(); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  await test('GET', '/api/v1/health');
  await test('GET', '/api/v1/time-blocks/my', auth);
  await test('GET', '/api/v1/time-blocks/by-date/2026-06-08', auth);
  await test('PATCH', '/api/v1/time-blocks/d15625e5-bef8-4e49-9371-26f731463f23', auth, { title: 'smoke-updated' });
  await test('POST', '/api/v1/time-blocks/b1/comments', auth, { content: 'test comment' });
  await test('GET', '/api/v1/time-blocks/b1/comments', auth);
  await test('GET', '/api/v1/tasks/my', auth);
  await test('GET', '/api/v1/tasks/my/stats', auth);
})();
