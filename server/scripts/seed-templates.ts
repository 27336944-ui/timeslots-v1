import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface TemplateSeed {
  name: string;
  type: string;
  title: string;
  goal: string;
  priority: string;
  categoryId: string | null;
  defaultNature: string;
  config: string;
  sortOrder: number;
  isSystem: boolean;
}

const SYSTEM_TEMPLATES: TemplateSeed[] = [
  {
    name: '育儿协同包',
    type: 'timeblock',
    title: '育儿协同日程包',
    goal: '夫妻分工带娃的一天，自动创建照顾宝宝的核心时间块',
    priority: 'high',
    categoryId: null,
    defaultNature: 'PUBLIC',
    sortOrder: 0,
    isSystem: true,
    config: JSON.stringify({
      blocks: [
        { title: '晨间喂奶+洗漱', startOffsetMinutes: 0, durationMinutes: 60, goal: '宝宝起床喂奶、换尿布、洗漱', priority: 'high' },
        { title: '户外活动时间', startOffsetMinutes: 180, durationMinutes: 90, goal: '推车散步或小区活动', priority: 'medium' },
        { title: '午睡时段', startOffsetMinutes: 360, durationMinutes: 120, goal: '哄睡+陪睡，大人也趁机休息', priority: 'high' },
        { title: '亲子游戏/早教', startOffsetMinutes: 600, durationMinutes: 60, goal: '陪宝宝做早教游戏或读绘本', priority: 'medium' },
        { title: '晚间洗澡+安抚', startOffsetMinutes: 780, durationMinutes: 60, goal: '睡前流程：洗澡、按摩、讲故事', priority: 'high' },
      ],
    }),
  },
  {
    name: '深度工作包',
    type: 'timeblock',
    title: '深度工作日程包',
    goal: '一天中安排 3 段深度工作时间，配合休息恢复精力',
    priority: 'high',
    categoryId: null,
    defaultNature: 'PUBLIC',
    sortOrder: 1,
    isSystem: true,
    config: JSON.stringify({
      blocks: [
        { title: '晨间深度工作', startOffsetMinutes: 0, durationMinutes: 120, goal: '精力最好时段，做最难的任务', priority: 'high' },
        { title: '短暂休息+补充能量', startOffsetMinutes: 150, durationMinutes: 30, goal: '站起来走走、喝水、吃水果', priority: 'low' },
        { title: '午前浅层工作', startOffsetMinutes: 210, durationMinutes: 90, goal: '处理邮件、消息、琐碎事务', priority: 'medium' },
        { title: '午间恢复', startOffsetMinutes: 360, durationMinutes: 60, goal: '午餐+午休，为下午充电', priority: 'low' },
        { title: '午后深度工作', startOffsetMinutes: 480, durationMinutes: 120, goal: '第二段深度工作，攻克核心产出', priority: 'high' },
        { title: '复盘+收尾', startOffsetMinutes: 720, durationMinutes: 60, goal: '回顾今日、整理明日待办', priority: 'medium' },
      ],
    }),
  },
  {
    name: '伴侣陪伴包',
    type: 'timeblock',
    title: '伴侣陪伴日程包',
    goal: '为有质量的二人时间预留空间，不被琐事吞没',
    priority: 'medium',
    categoryId: null,
    defaultNature: 'PRIVATE',
    sortOrder: 2,
    isSystem: true,
    config: JSON.stringify({
      blocks: [
        { title: '一起准备晚餐', startOffsetMinutes: 480, durationMinutes: 60, goal: '共同下厨，边做饭边聊天', priority: 'medium' },
        { title: '二人晚餐时间', startOffsetMinutes: 570, durationMinutes: 60, goal: '关掉手机，专心吃饭交流', priority: 'high' },
        { title: '散步/共同活动', startOffsetMinutes: 660, durationMinutes: 60, goal: '小区散步或一起看一集剧', priority: 'medium' },
        { title: '睡前交流', startOffsetMinutes: 780, durationMinutes: 30, goal: '聊聊感受、规划明天', priority: 'medium' },
      ],
    }),
  },
];

async function seed() {
  console.log('Seeding system scenario templates...');

  for (const tpl of SYSTEM_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { userId: SYSTEM_USER_ID, name: tpl.name, isDeleted: false },
    });

    if (existing) {
      console.log(`  Skipping (already exists): ${tpl.name}`);
      continue;
    }

    await prisma.template.create({
      data: {
        userId: SYSTEM_USER_ID,
        name: tpl.name,
        type: tpl.type,
        title: tpl.title,
        goal: tpl.goal,
        priority: tpl.priority,
        categoryId: tpl.categoryId,
        defaultDuration: null,
        defaultNature: tpl.defaultNature,
        config: tpl.config,
        sortOrder: tpl.sortOrder,
        isSystem: tpl.isSystem,
      },
    });

    const blockCount = JSON.parse(tpl.config).blocks.length;
    console.log(`  Created: ${tpl.name} (${blockCount} blocks)`);
  }

  console.log('Seed complete');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
