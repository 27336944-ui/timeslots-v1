// E2E test with real UUIDs
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const baseURL = 'http://127.0.0.1:7777';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_USER_OPENID = 'test_openid_e2e_001';

function req(method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, baseURL);
    const opts = {
      hostname: url.hostname, port: url.port, path: url.pathname, method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const start = Date.now();
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed, ms: Date.now() - start });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message, ms: Date.now() - start }));
    r.setTimeout(10000, () => { r.destroy(); resolve({ status: -1, body: 'timeout', ms: 10000 }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  // Pre-seed: ensure test user + quota exist
  const p = new PrismaClient();
  try {
    const u = await p.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        openid: TEST_USER_OPENID,
        nickname: 'E2E Test',
        dayStartsAt: '04:00',
        coachSettings: { tone: 'professional', weeklyReportDay: 'SUNDAY' },
        status: 'ACTIVE',
      },
    });
    console.log(`Pre-seeded user: ${u.id} (openid=${u.openid})`);

    const q = await p.quota.upsert({
      where: { userId: TEST_USER_ID },
      update: {},
      create: { userId: TEST_USER_ID, permanentPoints: 1000, monthlyPoints: 0 },
    });
    console.log(`Pre-seeded quota: permanent=${q.permanentPoints} monthly=${q.monthlyPoints}`);
  } catch (e) {
    console.log('Pre-seed FAIL:', e.code, e.message);
  } finally {
    await p.$disconnect();
  }

  const tests = [
    { name: 'T1 /health', method: 'GET', path: '/api/v1/health' },
    { name: 'T2 /events/my 401 no auth', method: 'GET', path: '/api/v1/events/my' },
    { name: 'T3 /events/my 200 (empty)', method: 'GET', path: '/api/v1/events/my', headers: { Authorization: `Bearer ${TEST_USER_ID}` } },
    { name: 'T4 POST /events 400 empty body', method: 'POST', path: '/api/v1/events', headers: { Authorization: `Bearer ${TEST_USER_ID}` }, body: {} },
    { name: 'T5 POST /events 400 endTime<=start', method: 'POST', path: '/api/v1/events', headers: { Authorization: `Bearer ${TEST_USER_ID}` }, body: { title: 'x', startTime: '2026-06-08T11:00:00Z', endTime: '2026-06-08T10:00:00Z' } },
    { name: 'T6 POST /events 201 create', method: 'POST', path: '/api/v1/events', headers: { Authorization: `Bearer ${TEST_USER_ID}` }, body: { title: 'smoke', startTime: '2026-06-08T10:00:00Z', endTime: '2026-06-08T11:00:00Z' } },
    { name: 'T7 /events/my after create', method: 'GET', path: '/api/v1/events/my', headers: { Authorization: `Bearer ${TEST_USER_ID}` } },
  ];

  for (const t of tests) {
    const r = await req(t.method, t.path, t.headers, t.body);
    const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    const bodyShort = bodyStr.length > 220 ? bodyStr.slice(0, 220) + '...' : bodyStr;
    console.log(`${t.name.padEnd(38)} ${r.status} ${r.ms}ms  ${bodyShort}`);
  }
})();
