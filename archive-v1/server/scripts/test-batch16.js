const http = require('http');
const base = { hostname: 'localhost', port: 7777, headers: { 'Content-Type': 'application/json' } };

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
  // 1. Health check
  await test('GET', '/api/v1/health');

  // 2. Login with existing user -> get real JWT
  await test('POST', '/api/v1/auth/login', {}, { userId: '11111111-1111-1111-1111-111111111111' });

  // 3. Login with NEW user (should auto-register + get JWT)
  await test('POST', '/api/v1/auth/login', {}, { userId: '22222222-2222-2222-2222-222222222222' });

  // 4. Use real JWT to call time-blocks/my
  // Need to capture token from step 2 first
  const loginRes = await new Promise(resolve => {
    const opts = { ...base, path: '/api/v1/auth/login', method: 'POST', headers: base.headers };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.write(JSON.stringify({ userId: '11111111-1111-1111-1111-111111111111' }));
    req.end();
  });
  const token = JSON.parse(loginRes.body).accessToken;
  console.log('Obtained JWT:', token.substring(0, 40) + '...');
  await test('GET', '/api/v1/time-blocks/my', { Authorization: `Bearer ${token}` });

  // 5. Old-style hardcoded UUID Bearer should now FAIL (401)
  await test('GET', '/api/v1/time-blocks/my', { Authorization: 'Bearer 11111111-1111-1111-1111-111111111111' });
})();
