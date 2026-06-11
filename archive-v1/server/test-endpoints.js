const http = require('http');
function test(method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 7777, path, method, headers: { 'Content-Type': 'application/json', ...headers } };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log(`[${method} ${path}] HTTP ${res.statusCode} code=${(JSON.parse(data).code)}`);
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${method} ${path}] ERROR: ${e.message}`); resolve(); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
(async () => {
  await test('GET', '/api/v1/health');
  await test('GET', '/api/v1/events/my');
  await test('GET', '/api/v1/events', { Authorization: 'Bearer user-1' });
  await test('POST', '/api/v1/events', { Authorization: 'Bearer user-1' }, { title: 'x' });
  await test('POST', '/api/v1/events', { Authorization: 'Bearer user-1' }, { title: 'hi', startTime: 'invalid' });
})();
