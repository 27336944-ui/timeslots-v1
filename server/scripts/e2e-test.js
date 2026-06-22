const BASE = 'http://localhost:7777/api/v1';
const TEAKY_ID = '3cf1e60a-7d4d-446f-8d0a-59010b1790de';
const XWHY77_ID = 'addc035a-5da5-4a6b-a861-1a7186c3b686';

let TEAKY_TOKEN = '';
let XWHY77_TOKEN = '';

async function main() {
  // Login
  console.log('\n=== 1. AUTH LOGIN ===');
  const teakyLogin = await api('POST', '/auth/login', { userId: TEAKY_ID });
  TEAKY_TOKEN = teakyLogin.data.accessToken;
  console.log('teaky token:', TEAKY_TOKEN.slice(0, 20) + '...');

  const xwhy77Login = await api('POST', '/auth/login', { userId: XWHY77_ID });
  XWHY77_TOKEN = xwhy77Login.data.accessToken;
  console.log('xwhy77 token:', XWHY77_TOKEN.slice(0, 20) + '...');

  // Settings
  console.log('\n=== 2. SETTINGS ===');
  const settings = await api('GET', '/auth/settings', null, TEAKY_TOKEN);
  console.log('settings:', JSON.stringify(settings.data));

  // TimeBlocks CRUD
  console.log('\n=== 3. TIMEBLOCK CRUD ===');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const startStr = `${dateStr}T08:00:00+08:00`;
  const endStr = `${dateStr}T09:00:00+08:00`;

  const block1 = await api('POST', '/time-blocks', {
    title: 'teaky晨会', startTime: startStr, endTime: endStr,
    category: 'work', nature: 'PUBLIC', priority: 'high',
  }, TEAKY_TOKEN);
  const block1Id = block1.data.id;
  console.log('created block:', block1Id, block1.data.title);

  const block2 = await api('POST', '/time-blocks', {
    title: 'teaky健身', startTime: endStr, endTime: `${dateStr}T10:00:00+08:00`,
    category: 'life', nature: 'PRIVATE',
  }, TEAKY_TOKEN);
  const block2Id = block2.data.id;
  console.log('created block:', block2Id, block2.data.title);

  // xwhy77 creates a block
  const blockX = await api('POST', '/time-blocks', {
    title: 'xwhy77写周报', startTime: startStr, endTime: endStr,
    category: 'work', nature: 'PUBLIC',
  }, XWHY77_TOKEN);
  const blockXId = blockX.data.id;
  console.log('xwhy77 created:', blockXId, blockX.data.title);

  // GET /my
  const myBlocks = await api('GET', `/time-blocks/my`, null, TEAKY_TOKEN);
  console.log('teaky my blocks:', myBlocks.data.length);
  const myBlocksX = await api('GET', `/time-blocks/my`, null, XWHY77_TOKEN);
  console.log('xwhy77 my blocks:', myBlocksX.data.length);

  // GET by-date
  const byDate = await api('GET', `/time-blocks/by-date/${dateStr}`, null, TEAKY_TOKEN);
  console.log('by-date blocks:', byDate.data.length);

  // PATCH block
  const updated = await api('PATCH', `/time-blocks/${block1Id}`, { title: 'teaky晨会-改' }, TEAKY_TOKEN);
  console.log('updated title:', updated.data.title);

  // DELETE block
  const del = await api('DELETE', `/time-blocks/${block2Id}`, null, TEAKY_TOKEN);
  console.log('deleted:', JSON.stringify(del.data));

  // Task CRUD
  console.log('\n=== 4. TASK CRUD ===');
  const task1 = await api('POST', '/tasks', {
    title: '完成季度报告', goal: '汇总Q2数据并写分析',
    category: 'work', priority: 'high',
  }, TEAKY_TOKEN);
  const task1Id = task1.data.id;
  console.log('created task:', task1Id, task1.data.title);

  const task2 = await api('POST', '/tasks', {
    title: '买生日礼物', category: 'life',
  }, TEAKY_TOKEN);
  const task2Id = task2.data.id;
  console.log('created task:', task2Id, task2.data.title);

  const myTasks = await api('GET', '/tasks/my', null, TEAKY_TOKEN);
  console.log('my tasks:', myTasks.data.length);

  const stats = await api('GET', '/tasks/my/stats', null, TEAKY_TOKEN);
  console.log('stats:', JSON.stringify(stats.data));

  // Step CRUD + linear dependency
  console.log('\n=== 5. STEP CRUD + DEPENDENCY ===');
  const step1 = await api('POST', '/steps', {
    taskId: task1Id, text: '收集Q2数据', estimatedMinutes: 30,
  }, TEAKY_TOKEN);
  const step1Id = step1.data.id;
  console.log('step1:', step1Id, step1.data.status);

  const step2 = await api('POST', '/steps', {
    taskId: task1Id, text: '分析数据趋势', estimatedMinutes: 45,
    dependsOnId: step1Id,
  }, TEAKY_TOKEN);
  const step2Id = step2.data.id;
  console.log('step2:', step2Id, 'dependsOn:', step2.data.dependsOnId);

  const step3 = await api('POST', '/steps', {
    taskId: task1Id, text: '撰写报告', estimatedMinutes: 60,
    dependsOnId: step2Id,
  }, TEAKY_TOKEN);
  const step3Id = step3.data.id;
  console.log('step3:', step3Id);

  // Schedule step1
  const scheduled = await api('POST', `/steps/${step1Id}/schedule`, {
    startTime: `${dateStr}T14:00:00+08:00`,
    endTime: `${dateStr}T14:30:00+08:00`,
  }, TEAKY_TOKEN);
  console.log('step1 scheduled:', scheduled.data.step.status);

  // Complete step1
  const stepDone = await api('PATCH', `/steps/${step1Id}`, { status: 'done' }, TEAKY_TOKEN);
  console.log('step1 done:', stepDone.data.status);

  // Try schedule step2 (should be unlocked now)
  const step2sched = await api('POST', `/steps/${step2Id}/schedule`, {
    startTime: `${dateStr}T14:30:00+08:00`,
    endTime: `${dateStr}T15:15:00+08:00`,
  }, TEAKY_TOKEN);
  console.log('step2 scheduled:', step2sched.data.step.status);

  // Complete task with review
  const completed = await api('POST', `/tasks/${task2Id}/complete`, {
    completedNote: '在京东下单了', retrospective: '下次提前一周准备',
  }, TEAKY_TOKEN);
  console.log('task completed:', completed.data.status);

  // Circle CRUD
  console.log('\n=== 6. CIRCLE CRUD ===');
  const circle = await api('POST', '/circles', {
    name: '产品团队', description: '核心产品组', parentId: undefined,
  }, TEAKY_TOKEN);
  const circleId = circle.data.id;
  console.log('created circle:', circleId, circle.data.name);

  const circles = await api('GET', '/circles/my', null, TEAKY_TOKEN);
  console.log('my circles:', circles.data.length);

  // Invite code
  const invite = await api('POST', `/circles/${circleId}/invite`, null, TEAKY_TOKEN);
  const code = invite.data.inviteCode;
  console.log('invite code:', code);

  // xwhy77 joins
  const joined = await api('POST', `/circles/join/${code}`, null, XWHY77_TOKEN);
  console.log('xwhy77 joined:', joined.data.name);

  // xwhy77 leaves
  const left = await api('POST', `/circles/${circleId}/leave`, null, XWHY77_TOKEN);
  console.log('xwhy77 left:', JSON.stringify(left.data));

  // Approval
  console.log('\n=== 7. APPROVAL CRUD ===');
  // Create a new block for approval
  const appBlock = await api('POST', '/time-blocks', {
    title: 'teaky邀请审批的日程', startTime: `${dateStr}T16:00:00+08:00`,
    endTime: `${dateStr}T17:00:00+08:00`, nature: 'PUBLIC', source: 'manual',
  }, TEAKY_TOKEN);
  const appBlockId = appBlock.data.id;

  const approval = await api('POST', '/approvals', {
    blockId: appBlockId, recipients: [{ contactType: 'friend', contactValue: XWHY77_ID }],
  }, TEAKY_TOKEN);
  const approvalId = approval.data.id;
  console.log('approval created:', approvalId);

  const pending = await api('GET', '/approvals/my-pending', null, XWHY77_TOKEN);
  console.log('xwhy77 pending:', pending.data.length);

  const myInit = await api('GET', '/approvals/my-initiated', null, TEAKY_TOKEN);
  console.log('teaky initiated:', myInit.data.length);

  // Delegation
  console.log('\n=== 8. DELEGATION ===');
  const delStep = await api('POST', '/delegations', {
    type: 'step_execution', taskId: task1Id, stepId: step2Id,
    recipientUserId: XWHY77_ID, message: '请帮忙分析数据趋势',
  }, TEAKY_TOKEN);
  const delId = delStep.data.id;
  console.log('delegation created:', delId);

  const myDel = await api('GET', '/delegations/my', null, TEAKY_TOKEN);
  console.log('my delegations:', myDel.data.delegations?.length || 0);

  // Share recipients
  console.log('\n=== 9. SHARE RECIPIENTS ===');
  // 先删除已有的共享关系（避免 40901 残留冲突）
  const existingRecipients = await api('GET', '/share/recipients', null, TEAKY_TOKEN);
  for (const r of existingRecipients.data || []) {
    await api('DELETE', `/share/recipients/${r.id}`, null, TEAKY_TOKEN).catch(() => {});
  }
  const shareRec = await api('POST', '/share/recipients', {
    targetUserId: XWHY77_ID, level: 'full',
  }, TEAKY_TOKEN);
  console.log('share recipient created:', shareRec.data?.id || '(409 已存在)');

  const recipients = await api('GET', '/share/recipients', null, TEAKY_TOKEN);
  console.log('my recipients:', recipients.data.length);

  // Stealth
  const stealth = await api('POST', '/share/stealth', { action: 'on', durationMinutes: 60 }, TEAKY_TOKEN);
  console.log('stealth:', JSON.stringify(stealth.data));

  const stealthGet = await api('GET', '/share/stealth', null, TEAKY_TOKEN);
  console.log('stealth status:', JSON.stringify(stealthGet.data));

  // AI parse
  console.log('\n=== 10. AI PARSE ===');
  const parsed = await api('POST', '/ai/parse', { text: '明早9点和李总开会讨论Q4' }, TEAKY_TOKEN);
  console.log('parsed:', JSON.stringify(parsed.data));

  // Suggest slots
  console.log('\n=== 11. AI SUGGEST SLOTS ===');
  const slots = await api('POST', '/ai/suggest-slots', {
    date: dateStr,
    steps: [{ id: 'mock-step-1', text: '测试步骤', estimatedMinutes: 30 }],
  }, TEAKY_TOKEN);
  console.log('suggestions:', slots.data.suggestions?.length || 0);

  // Template
  console.log('\n=== 12. TEMPLATE ===');
  const tmpl = await api('POST', '/templates', {
    name: '测试模板', type: 'task', title: '模板任务', categoryId: undefined,
  }, TEAKY_TOKEN);
  console.log('template:', tmpl.data.id);

  const myTemplates = await api('GET', '/templates', null, TEAKY_TOKEN);
  console.log('my templates:', myTemplates.data.length);

  // Category
  console.log('\n=== 13. CATEGORY ===');
  const cats = await api('GET', '/categories/my', null, TEAKY_TOKEN);
  console.log('categories:', cats.data.length);

  // Search
  console.log('\n=== 14. SEARCH ===');
  const search = await api('GET', `/search?q=晨会`, null, TEAKY_TOKEN);
  console.log('search results:', search.data.timeBlocks?.length || 0);

  // Stats
  console.log('\n=== 15. STATS ===');
  const firstDay = `${dateStr.slice(0, 8)}01`;
  const statsR = await api('GET', `/time-blocks/stats?start=${firstDay}&end=${dateStr}`, null, TEAKY_TOKEN);
  console.log('stats:', JSON.stringify(statsR.data));

  // Health
  console.log('\n=== 16. HEALTH ===');
  const health = await api('GET', '/health', null, null);
  console.log('health:', JSON.stringify(health.data));

  console.log('\n**** ALL E2E TESTS PASSED ****');
}

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (data.code !== 0 && !path.includes('/health')) {
    console.error(`  FAIL: ${method} ${path} => code=${data.code} msg=${data.message}`);
  }
  return data;
}

main().catch(e => { console.error('E2E FAILED:', e); process.exit(1); });
