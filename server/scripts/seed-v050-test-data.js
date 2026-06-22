/**
 * v0.50 验证门禁 — 预填测试数据
 * 创建 3 个内测用户 + 示例日程/任务
 * 用法: cd server && node scripts/seed-v050-test-data.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NOW = new Date();
const todayLocal = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()));

function d(offset, h, m) {
  const d = new Date(todayLocal.getTime() + offset * 86400000);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

const TEST_USERS = [
  { id: 'a0000001-0000-0000-0000-000000000001', nickname: '路测A', tag: '路径二引导' },
  { id: 'a0000001-0000-0000-0000-000000000002', nickname: '路测B', tag: '路径三引导' },
  { id: 'a0000001-0000-0000-0000-000000000003', nickname: '路测C', tag: '自由使用' },
];

async function main() {
  for (const u of TEST_USERS) {
    const user = await prisma.user.upsert({
      where: { id: u.id },
      update: { nickname: u.nickname },
      create: { id: u.id, nickname: u.nickname },
    });
    console.log(`用户 ${u.nickname} (${u.tag}): ${user.id}`);

    // 任务 (每个用户 2 个任务)
    const task1 = await prisma.task.create({
      data: {
        userId: u.id,
        title: '准备 Q3 汇报材料',
        goal: '收集数据、分析趋势、制作 PPT',
        status: 'in_progress',
        priority: 'high',
        category: 'work',
        dueAt: d(2, 18, 0),
      },
    });
    // 创建 task 关联的 Step (独立表, 不含 userId 字段)
    await prisma.step.createMany({
      data: [
        { taskId: task1.id, text: '导出 Q2 数据', status: 'unscheduled', sortOrder: 0 },
        { taskId: task1.id, text: '分析同比趋势', status: 'unscheduled', sortOrder: 1 },
        { taskId: task1.id, text: '制作 PPT 初稿', status: 'unscheduled', sortOrder: 2 },
      ],
    });
    console.log(`  task: ${task1.title} (${task1.id}) + 3 steps`);

    const task2 = await prisma.task.create({
      data: {
        userId: u.id,
        title: '周末采购清单',
        goal: '列好清单去超市',
        status: 'in_progress',
        priority: 'medium',
        category: 'life',
      },
    });
    await prisma.step.createMany({
      data: [
        { taskId: task2.id, text: '列清单', status: 'done', sortOrder: 0 },
        { taskId: task2.id, text: '去超市采购', status: 'unscheduled', sortOrder: 1 },
      ],
    });
    console.log(`  task: ${task2.title} (${task2.id}) + 2 steps`);

    // 日程 (今天 + 明天各 2-3 个)
    const blocks = [
      { title: '晨会', start: d(0, 9, 0), end: d(0, 9, 30), nature: 'PUBLIC' },
      { title: '写代码', start: d(0, 10, 0), end: d(0, 12, 0), nature: 'PUBLIC' },
      { title: '午休', start: d(0, 12, 0), end: d(0, 13, 0), nature: 'PRIVATE' },
      { title: '客户沟通', start: d(0, 14, 0), end: d(0, 15, 30), nature: 'PUBLIC' },
      { title: '健身', start: d(0, 18, 0), end: d(0, 19, 0), nature: 'PRIVATE' },
      { title: '需求评审', start: d(1, 9, 30), end: d(1, 11, 0), nature: 'PUBLIC' },
      { title: '周会', start: d(1, 14, 0), end: d(1, 15, 0), nature: 'PUBLIC' },
    ];

    for (const b of blocks) {
      await prisma.timeBlock.create({
        data: {
          userId: u.id,
          title: b.title,
          startTime: b.start,
          endTime: b.end,
          nature: b.nature,
          source: 'manual',
        },
      });
    }
    console.log(`  ${blocks.length} blocks created`);
  }

  console.log('\n✅ 3 测试用户数据已就绪');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect().then(() => process.exit(1)); });
