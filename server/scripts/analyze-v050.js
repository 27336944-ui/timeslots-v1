/**
 * v0.50 验证门禁分析脚本
 * 用法: cd server && node scripts/analyze-v050.js
 *
 * 连接 PG 查询 event_logs + time_blocks + tasks + users
 * 输出: D1 留存 / 源路径占比 / AI 使用率 / 用户活跃度
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAY_MS = 86400000;

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function today() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  const T0 = today();
  const report = { generatedAt: T0.toISOString() };

  // 1. 用户概览
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: { id: true, nickname: true, createdAt: true },
  });
  report.totalUsers = users.length;
  report.users = users.map(u => ({ id: u.id, nickname: u.nickname, createdAt: fmt(u.createdAt) }));

  // 2. 事件日志活跃度
  const events = await prisma.eventLog.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const userActivity = {};
  for (const ev of events) {
    if (!userActivity[ev.userId]) userActivity[ev.userId] = { days: new Set(), eventTypes: new Set(), total: 0 };
    userActivity[ev.userId].days.add(fmt(ev.createdAt));
    userActivity[ev.userId].eventTypes.add(ev.eventType);
    userActivity[ev.userId].total++;
  }

  // D1 留存: 用户有 >= 2 个不同日期的活动
  let d1Retained = 0;
  let d1Eligible = 0;
  for (const [uid, act] of Object.entries(userActivity)) {
    if (act.days.size >= 2) d1Retained++;
    if (act.days.size >= 1) d1Eligible++;
  }
  report.d1Retention = {
    eligible: d1Eligible,
    retained: d1Retained,
    rate: d1Eligible > 0 ? (d1Retained / d1Eligible * 100).toFixed(1) + '%' : 'N/A',
  };

  // 3. 来源路径分布 (block_create)
  const blockEvents = events.filter(e => e.eventType === 'block_create');
  const sourceCount = {};
  for (const ev of blockEvents) {
    const src = ev.payload?.source || 'unknown';
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  }
  report.sourceBreakdown = sourceCount;
  const totalBlocks = blockEvents.length;
  if (totalBlocks > 0) {
    report.sourcePercent = {};
    for (const [k, v] of Object.entries(sourceCount)) {
      report.sourcePercent[k] = (v / totalBlocks * 100).toFixed(1) + '%';
    }
  }

  // 4. AI 使用率 (event_logs 已补充 ai_parse/ai_decompose)
  const aiParses = events.filter(e => e.eventType === 'ai_parse').length;
  const aiDecomposes = events.filter(e => e.eventType === 'ai_decompose').length;
  const aiUsers = new Set(events.filter(e => e.eventType.startsWith('ai_')).map(e => e.userId));
  const stepSchedules = events.filter(e => e.eventType === 'step_schedule').length;
  const approvalCreates = events.filter(e => e.eventType === 'approval_create').length;
  const delegationCreates = events.filter(e => e.eventType === 'delegation_create').length;
  report.pathUsage = {
    path1Approval: approvalCreates,
    path1Delegation: delegationCreates,
    path2StepSchedule: stepSchedules,
    path3Manual: sourceCount['manual'] || 0,
    aiParse: aiParses,
    aiDecompose: aiDecomposes,
    aiUserCount: aiUsers.size,
  };

  // 5. 当前数据库记录数
  const [blockCount, taskCount, stepCount, circleCount] = await Promise.all([
    prisma.timeBlock.count({ where: { isDeleted: false } }),
    prisma.task.count({ where: { isDeleted: false } }),
    prisma.step.count({ where: { isDeleted: false } }),
    prisma.circle.count({ where: { isDeleted: false } }),
  ]);
  report.recordCounts = {
    timeBlocks: blockCount,
    tasks: taskCount,
    steps: stepCount,
    circles: circleCount,
    eventLogs: events.length,
  };

  // 6. 活跃用户详情 (top 5 by event count)
  const sortedUsers = Object.entries(userActivity)
    .map(([uid, act]) => ({
      userId: uid,
      nickname: users.find(u => u.id === uid)?.nickname || '(unknown)',
      totalEvents: act.total,
      activeDays: act.days.size,
      dateRange: [...act.days].sort().slice(0, 1).concat([...act.days].sort().slice(-1)).join(' ~ '),
      eventTypes: [...act.eventTypes].join(', '),
    }))
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, 10);
  report.activeUsers = sortedUsers;

  // 输出报告
  console.log('\n========================================');
  console.log('  v0.50 验证门禁 — 数据分析报告');
  console.log('========================================\n');

  console.log('📊 用户概览');
  console.log(`  总用户数: ${report.totalUsers}`);
  console.log(`  活跃用户(有日志): ${d1Eligible}`);
  console.log(`  D1 留存(≥2天活动): ${d1Retained}/${d1Eligible} = ${report.d1Retention.rate}`);
  console.log(`  阈值: ≥30% ${d1Eligible > 0 && d1Retained / d1Eligible >= 0.3 ? '✅ 达标' : '❌ 未达标'}\n`);

  console.log('📦 数据库记录数');
  for (const [k, v] of Object.entries(report.recordCounts)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log();

  console.log('🔀 来源路径分布 (block_create)');
  const totalB = totalBlocks;
  for (const [k, v] of Object.entries(sourceCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${report.sourcePercent?.[k] || '0%'})`);
  }
  if (totalB === 0) console.log('  (暂无数据)');
  console.log(`  总计: ${totalB}\n`);

  console.log('🛤️  路径使用统计');
  for (const [k, v] of Object.entries(report.pathUsage)) {
    if (k === 'aiUserCount') continue;
    console.log(`  ${k}: ${v}`);
  }
  console.log();

  console.log('🤖 AI 使用统计');
  console.log(`  ai_parse (自然语言建日程): ${report.pathUsage.aiParse} 次`);
  console.log(`  ai_decompose (AI 拆解): ${report.pathUsage.aiDecompose} 次`);
  console.log(`  AI 独立用户: ${report.pathUsage.aiUserCount} 人`);
  const aiRate = d1Eligible > 0 ? (report.pathUsage.aiUserCount / d1Eligible * 100).toFixed(1) + '%' : 'N/A';
  console.log(`  AI 使用率: ${aiRate}  阈值: ≥20% ${d1Eligible > 0 && report.pathUsage.aiUserCount / d1Eligible >= 0.2 ? '✅ 达标' : '❌ 未达标'}`);
  console.log();

  console.log('👤 最活跃用户 Top 10');
  for (const u of sortedUsers) {
    console.log(`  ${u.nickname.padEnd(12)} ${String(u.totalEvents).padStart(4)} 事件 ${String(u.activeDays).padStart(2)} 天  ${u.dateRange}`);
  }
  console.log();

  console.log('⚠️  已知限制');
  console.log('  - D1 留存为近似值 (基于 event_logs 活跃天数, 非真实次日回访)');
  console.log('  - 30 日委托 vs 非委托留存金标准需 v0.51+ 才能统计');
  console.log();

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect().then(() => process.exit(1)); });
