const http = require('http');
const base = { hostname: 'localhost', port: 7777, headers: { 'Content-Type': 'application/json' } };

async function test(method, path, headers, body) {
  const opts = { ...base, path, method, headers: { ...base.headers, ...headers } };
  return new Promise(resolve => {
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ statusCode: 0, body: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const results = [];

  // 1. Health
  let r = await test('GET', '/api/v1/health');
  results.push({n:'GET /health',s:r.statusCode,ok:r.statusCode===200});

  // 2. Login -> get JWT
  r = await test('POST', '/api/v1/auth/login', {}, { userId: '11111111-1111-1111-1111-111111111111' });
  let token = '';
  if (r.statusCode === 201) {
    token = JSON.parse(r.body).data.accessToken;
    results.push({n:'POST /auth/login (get JWT)',s:r.statusCode,ok:true});
  } else {
    results.push({n:'POST /auth/login',s:r.statusCode,ok:false,err:r.body.substring(0,100)});
  }
  const auth = { Authorization: `Bearer ${token}` };

  // 3. Guard rejects old-style Bearer
  r = await test('GET', '/api/v1/time-blocks/my', { Authorization: 'Bearer bad-token' });
  results.push({n:'GET /time-blocks/my (bad token → 401)',s:r.statusCode,ok:r.statusCode===401});

  // 4. TimeBlocks
  r = await test('GET', '/api/v1/time-blocks/my', auth);
  results.push({n:'GET /time-blocks/my',s:r.statusCode,ok:r.statusCode===200});
  r = await test('GET', '/api/v1/time-blocks/by-date/2026-06-08', auth);
  results.push({n:'GET /time-blocks/by-date',s:r.statusCode,ok:r.statusCode===200});
  r = await test('POST', '/api/v1/time-blocks', auth, { title:'审查', startTime:'2026-06-08T10:00:00Z', endTime:'2026-06-08T11:00:00Z' });
  results.push({n:'POST /time-blocks',s:r.statusCode,ok:r.statusCode===201});

  // 5. Tasks
  r = await test('GET', '/api/v1/tasks/my', auth);
  results.push({n:'GET /tasks/my',s:r.statusCode,ok:r.statusCode===200});
  r = await test('GET', '/api/v1/tasks/my/stats', auth);
  results.push({n:'GET /tasks/my/stats',s:r.statusCode,ok:r.statusCode===200});
  r = await test('POST', '/api/v1/tasks', auth, { title:'审查任务' });
  const taskId = r.statusCode===201 ? JSON.parse(r.body).data.id : null;
  results.push({n:'POST /tasks',s:r.statusCode,ok:r.statusCode===201});
  if (taskId) {
    r = await test('PATCH', `/api/v1/tasks/${taskId}`, auth, { status:'DONE' });
    results.push({n:'PATCH /tasks/:id (DONE)',s:r.statusCode,ok:r.statusCode===200});
  }

  // 6. TaskGroups
  r = await test('GET', '/api/v1/task-groups/my', auth);
  results.push({n:'GET /task-groups/my',s:r.statusCode,ok:r.statusCode===200});
  r = await test('POST', '/api/v1/task-groups', auth, { name:'工作' });
  results.push({n:'POST /task-groups',s:r.statusCode,ok:r.statusCode===201});

  // 7. Circles
  r = await test('GET', '/api/v1/circles/my', auth);
  results.push({n:'GET /circles/my',s:r.statusCode,ok:r.statusCode===200});

  // 8. Comments
  r = await test('GET', '/api/v1/time-blocks/my', auth);
  const blocks = r.statusCode===200 ? JSON.parse(r.body).data || [] : [];
  if (blocks.length > 0) {
    const bid = blocks[0].id;
    r = await test('POST', `/api/v1/time-blocks/${bid}/comments`, auth, { content:'good' });
    results.push({n:`POST /time-blocks/${bid.substring(0,8)}/comments`,s:r.statusCode,ok:r.statusCode===201});
    r = await test('GET', `/api/v1/time-blocks/${bid}/comments`, auth);
    results.push({n:`GET /time-blocks/${bid.substring(0,8)}/comments`,s:r.statusCode,ok:r.statusCode===200});
  }

  // 9. Users
  r = await test('GET', '/api/v1/users/me', auth);
  results.push({n:'GET /users/me',s:r.statusCode,ok:r.statusCode===200});

  // Summary
  const pass = results.filter(x => x.ok).length;
  const fail = results.filter(x => !x.ok).length;
  console.log('\n=== COMPREHENSIVE TEST REPORT ===');
  for (const x of results) {
    console.log(`  ${x.ok?'✅':'❌'} ${x.n} → HTTP ${x.s}${x.err ? ' '+x.err : ''}`);
  }
  console.log(`\nTotal: ${results.length} | ✅ Pass: ${pass} | ❌ Fail: ${fail}`);
})();
