import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const USER_ID = '00000000-0000-0000-0000-000000000000';
const TZ = '+08:00';

// ── date helpers ──
function t(dayOffset, hour, minute = 0) {
  const pad = n => String(n).padStart(2, '0');
  return `2026-06-${pad(22 + dayOffset)}T${pad(hour)}:${pad(minute)}:00${TZ}`;
}

// ── main ──
try {
  // 1. find or create project category
  const workCat = await p.category.findFirst({
    where: { userId: USER_ID, name: '工作', level: 1 }
  });
  if (!workCat) throw new Error('工作 category not found');
  
  let projectCat = await p.category.findFirst({
    where: { userId: USER_ID, name: '探店联名计划', parentId: workCat.id }
  });
  if (!projectCat) {
    projectCat = await p.category.create({
      data: {
        userId: USER_ID,
        name: '探店联名计划',
        parentId: workCat.id,
        level: 2,
        sortOrder: 0,
        color: '#10B981',
      }
    });
    console.log('Created category: 探店联名计划');
  }

  // 2. ── MONDAY (dayOffset=0, Jun 22) ──
  const monAnchors = [
    { title: '起床、洗漱、居家早餐',     start: [0,7,0],   end: [0,7,40],   r: 'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '地铁通勤至公司',            start: [0,7,40],  end: [0,8,20],   r: 'absolute', bb:0, ba:10, cat:'life',  nat:'PRIVATE', desc:'后附10分钟工位准备+当日任务梳理' },
    { title: '部门周会：同步本周进度指标', start: [0,9,30],  end: [0,10,30],  r: 'absolute', bb:10, ba:15, cat:'work', nat:'PUBLIC', desc:'前10分钟准备周报数据；后15分钟整理待办清单' },
    { title: '午餐 + 工位午休',           start: [0,12,0],  end: [0,13,30],  r: 'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '线下：与A品牌商务对接联名活动', start: [0,14,30], end: [0,16,0], r: 'absolute', bb:30, ba:20, cat:'work', nat:'PUBLIC', loc:'对方公司会议室', desc:'前预留30分钟通勤+资料打印；后预留20分钟返程+纪要整理' },
    { title: '下班通勤回家',               start: [0,18,0],  end: [0,18,40],  r: 'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '双人晚餐 + 周末出行初步沟通', start: [0,19,10], end: [0,20,0],  r: 'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '居家健身（力量训练）',        start: [0,20,30], end: [0,21,30],  r: 'relative', bb:0, ba:10, cat:'private', nat:'PRIVATE', desc:'后附10分钟拉伸+洗漱' },
    { title: '睡前阅读 + 手机充电',        start: [0,22,30], end: [0,23,0],   r: 'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const monTasks = [
    { title: '拆解探店联名计划本周执行SOP，拆分12项细分任务', est: 90, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '整理3家品牌的基础权益清单，形成初步合作框架',     est: 60, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '同步周会待办至项目协作文档，同步给设计与商务组', est: 30, diff:'中难度（可拆分）', cat:'work' },
    { title: '筛选符合活动调性的博主名单，初筛20人',           est: 60, diff:'中难度（可拆分）', cat:'work' },
    { title: '回复日常工作消息、同步项目进度至对接群',         est: 30, diff:'低难度（碎片可做）', cat:'work' },
    { title: '预约周三门店踩点对接人，确认到场时间',           est: 15, diff:'低难度（碎片可做）', cat:'work' },
  ];

  // 3. ── TUESDAY (dayOffset=1, Jun 23) ──
  const tueAnchors = [
    { title: '起床、早餐',               start: [1,7,0],   end: [1,7,40],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '上班通勤',                  start: [1,7,40],  end: [1,8,20],   r:'absolute', bb:0, ba:10, cat:'life',  nat:'PRIVATE' },
    { title: '与设计部短会：同步活动视觉物料需求', start: [1,11,0], end: [1,11,30], r:'relative', bb:5, ba:10, cat:'work', nat:'PUBLIC', desc:'前5分钟整理需求清单；后10分钟同步修改意见' },
    { title: '午餐 + 午休',              start: [1,12,0],  end: [1,13,30],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '与B品牌线上对接：确认活动权益细节', start: [1,16,0], end: [1,16,40], r:'relative', bb:5, ba:10, cat:'work', nat:'PUBLIC', desc:'前5分钟调试会议设备；后10分钟更新需求文档' },
    { title: '下班通勤',                  start: [1,18,0],  end: [1,18,40],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '晚餐 + 家务分工（打扫厨房+衣物清洗）', start: [1,19,10], end: [1,20,0], r:'absolute', bb:0, ba:0, cat:'life', nat:'PRIVATE' },
    { title: '睡前阅读',                  start: [1,22,30], end: [1,23,0],   r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const tueTasks = [
    { title: '撰写3条探店视频核心脚本（分镜、台词、植入点）', est: 150, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '输出活动图文素材清单（15张图场景主题文案方向）', est: 60, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '整理博主合作brief框架，明确要求、交付、时间节点', est: 60, diff:'中难度（可拆分）', cat:'work' },
    { title: '同步昨日A品牌对接结果至内部项目组，更新进度表', est: 30, diff:'中难度（可拆分）', cat:'work' },
    { title: '回复各对接群消息、跟进设计排期', est: 30, diff:'低难度（碎片可做）', cat:'work' },
    { title: '确认周三踩点门店地址、停车信息、对接人联系方式', est: 15, diff:'低难度（碎片可做）', cat:'work' },
  ];

  // 4. ── WEDNESDAY (dayOffset=2, Jun 24) ──
  const wedAnchors = [
    { title: '起床、早餐',               start: [2,7,0],   end: [2,7,40],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '直接前往线下门店（地铁+步行）', start: [2,7,40], end: [2,8,30], r:'absolute', bb:0, ba:10, cat:'work', nat:'PUBLIC', desc:'后附10分钟现场准备' },
    { title: '线下：3家联名门店集中踩点',    start: [2,9,0],  end: [2,11,30], r:'absolute', bb:20, ba:15, cat:'work', nat:'PUBLIC', desc:'确认拍摄场景与动线+核对活动落地细节+与店长对接；门店间通勤20分钟/段；全程附15分钟机动缓冲' },
    { title: '商圈午餐 + 简短休息',          start: [2,12,0], end: [2,13,0],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '返程回公司',                  start: [2,14,0], end: [2,14,30], r:'absolute', bb:0, ba:10, cat:'work', nat:'PUBLIC', desc:'后附10分钟整理素材' },
    { title: '下班通勤回家',                start: [2,18,0], end: [2,18,40], r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '晚餐 + 和父母视频通话',        start: [2,19,10],end: [2,20,0], r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '线下瑜伽课',                  start: [2,20,30],end: [2,21,30], r:'relative', bb:10, ba:10, cat:'private', nat:'PRIVATE', desc:'前后各10分钟更衣/拉伸' },
    { title: '睡前阅读',                    start: [2,22,30],end: [2,23,0],  r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const wedTasks = [
    { title: '整理踩点现场照片视频素材，输出踩点报告', est: 120, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '根据实地情况优化视频脚本与图文素材清单', est: 60, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '同步踩点结果至3家品牌对接人，确认执行方案', est: 40, diff:'中难度（可拆分）', cat:'work' },
    { title: '更新博主brief，补充现场拍摄注意事项', est: 30, diff:'中难度（可拆分）', cat:'work' },
    { title: '同步项目进度至内部群，更新进度表', est: 20, diff:'低难度（碎片可做）', cat:'work' },
    { title: '预约周四博主对接会议，发送会议邀请', est: 15, diff:'低难度（碎片可做）', cat:'work' },
  ];

  // 5. ── THURSDAY (dayOffset=3, Jun 25) ──
  const thuAnchors = [
    { title: '起床、早餐',               start: [3,7,0],   end: [3,7,40],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '上班通勤',                  start: [3,7,40],  end: [3,8,20],   r:'absolute', bb:0, ba:10, cat:'life',  nat:'PRIVATE' },
    { title: '博主线上对接会：同步要求、解答疑问', start: [3,10,0], end: [3,11,30], r:'relative', bb:10, ba:20, cat:'work', nat:'PUBLIC', desc:'前10分钟调试设备+整理答疑清单；后20分钟整理参会名单与待办' },
    { title: '午餐 + 午休',              start: [3,12,0],  end: [3,13,30],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '设计物料初稿评审会：核对主视觉/海报', start: [3,14,30], end: [3,15,15], r:'relative', bb:5, ba:10, cat:'work', nat:'PUBLIC', desc:'前5分钟准备评审意见；后10分钟同步修改要求' },
    { title: '项目组内部短会：同步本周进度', start: [3,16,30], end: [3,17,0],  r:'relative', bb:0, ba:10, cat:'work', nat:'PUBLIC', desc:'后10分钟更新进度表' },
    { title: '下班通勤',                  start: [3,18,0],  end: [3,18,40],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '晚餐 + 周末出行最终规划',    start: [3,19,10], end: [3,20,0],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '睡前阅读',                  start: [3,22,30], end: [3,23,0],   r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const thuTasks = [
    { title: '根据物料评审意见输出详细修改清单', est: 90, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '确认最终合作博主名单（8人），输出执行表', est: 60, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '跟进C品牌最终需求确认，同步全部合作细节', est: 40, diff:'中难度（可拆分）', cat:'work' },
    { title: '整理博主对接会答疑纪要，同步至所有博主', est: 30, diff:'中难度（可拆分）', cat:'work' },
    { title: '回复日常对接消息，跟进各项待办进度', est: 30, diff:'低难度（碎片可做）', cat:'work' },
    { title: '整理本周项目资料，归档至项目文件夹', est: 20, diff:'低难度（碎片可做）', cat:'work' },
  ];

  // 6. ── FRIDAY (dayOffset=4, Jun 26) ──
  const friAnchors = [
    { title: '起床、早餐',               start: [4,7,0],   end: [4,7,40],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '上班通勤',                  start: [4,7,40],  end: [4,8,20],   r:'absolute', bb:0, ba:10, cat:'life',  nat:'PRIVATE' },
    { title: '项目周度复盘会：同步本周进度与下周计划', start: [4,14,0], end: [4,15,0], r:'absolute', bb:10, ba:15, cat:'work', nat:'PUBLIC', desc:'前10分钟准备复盘PPT；后15分钟更新项目计划' },
    { title: '午餐 + 午休',              start: [4,12,0],  end: [4,13,30],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '下班通勤',                  start: [4,18,0],  end: [4,18,40],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '朋友聚餐',                  start: [4,19,30], end: [4,21,30],  r:'relative', bb:15, ba:15, cat:'life', nat:'PUBLIC', desc:'前后各15分钟路程时间' },
    { title: '睡前洗漱放松',              start: [4,22,30], end: [4,23,0],   r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const friTasks = [
    { title: '制作项目周度复盘PPT，整理数据进度问题下周计划', est: 90, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '输出下周项目执行清单，拆解到每日核心任务与节点', est: 60, diff:'高难度（整块时间完成）', cat:'work' },
    { title: '跟进设计物料修改进度，确认下周一初稿交付', est: 30, diff:'中难度（可拆分）', cat:'work' },
    { title: '向3家品牌同步本周进度与下周安排', est: 40, diff:'中难度（可拆分）', cat:'work' },
    { title: '提交本周周报，整理个人待办闭环', est: 30, diff:'低难度（碎片可做）', cat:'work' },
    { title: '回复收尾消息，同步周末对接人联系方式', est: 20, diff:'低难度（碎片可做）', cat:'work' },
  ];

  // 7. ── SATURDAY (dayOffset=5, Jun 27) ──
  const satAnchors = [
    { title: '起床、早餐',               start: [5,7,30],  end: [5,8,30],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '超市采购 + 日用品囤货',      start: [5,10,0], end: [5,12,0],   r:'relative', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '午餐',                      start: [5,12,30], end: [5,13,30],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '双人户外徒步',               start: [5,15,0], end: [5,17,0],   r:'relative', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '居家晚餐',                   start: [5,18,0], end: [5,19,0],   r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '睡前阅读',                   start: [5,22,30],end: [5,23,0],   r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
  ];

  const satTasks = [
    { title: '衣物换季收纳、家居简单整理', est: 120, diff:'中难度', cat:'life' },
    { title: '回复工作紧急消息、手机照片归档', est: 30, diff:'低难度', cat:'work' },
  ];

  // 8. ── SUNDAY (dayOffset=6, Jun 28) ──
  const sunAnchors = [
    { title: '起床、早餐',               start: [6,7,30],  end: [6,8,30],   r:'absolute', bb:0, ba:0, cat:'life',   nat:'PRIVATE' },
    { title: '书店看书 + 咖啡',           start: [6,9,30],  end: [6,11,30],  r:'relative', bb:0, ba:0, cat:'private', nat:'PRIVATE' },
    { title: '外食午餐',                  start: [6,12,30], end: [6,13,30],  r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '晚餐',                      start: [6,18,0], end: [6,19,0],   r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
    { title: '下周日程梳理 + 项目预备',    start: [6,20,0], end: [6,20,40],  r:'relative', bb:0, ba:0, cat:'work',  nat:'PUBLIC' },
    { title: '睡前洗漱，准备周一通勤物品', start: [6,22,30],end: [6,23,0],   r:'absolute', bb:0, ba:0, cat:'life',  nat:'PRIVATE' },
  ];

  const sunTasks = [
    { title: '读书笔记整理、下周项目核心节点预演', est: 90, diff:'中难度', cat:'work' },
    { title: '居家轻度打扫、绿植浇水',            est: 30, diff:'低难度', cat:'life' },
  ];

  // ── batch insert helpers ──
  async function createAnchors(dayLabel, anchors) {
    let count = 0;
    for (const a of anchors) {
      const st = t(a.start[0], a.start[1], a.start[2]);
      const et = t(a.end[0], a.end[1], a.end[2]);
      await p.timeBlock.create({
        data: {
          userId: USER_ID,
          title: a.title,
          startTime: st,
          endTime: et,
          triggerTime: st,
          startDate: st,
          status: 'todo',
          rigidity: a.r,
          bufferBefore: a.bb,
          bufferAfter: a.ba,
          anchorType: 'other',
          category: a.cat,
          nature: a.nat,
          location: a.loc || null,
          description: a.desc || null,
          source: 'manual',
        }
      });
      count++;
    }
    console.log(`  ${dayLabel}: ${count} anchors`);
    return count;
  }

  function sd(offset) {
    const pad = n => String(n).padStart(2, '0');
    return `2026-06-${pad(22 + offset)}T00:00:00${TZ}`;
  }

  async function createTasks(dayLabel, tasks, dayOffset) {
    let count = 0;
    for (const tk of tasks) {
      await p.task.create({
        data: {
          userId: USER_ID,
          title: tk.title,
          status: 'pending',
          category: tk.cat,
          estimatedDuration: tk.est,
          startDate: sd(dayOffset),
          goal: `【${tk.diff}】归属于「探店联名计划」项目`,
        }
      });
      count++;
    }
    console.log(`  ${dayLabel}: ${count} tasks`);
    return count;
  }

  // clear existing test data for this user first
  console.log('Clearing existing test data...');
  const delBlocks = await p.timeBlock.deleteMany({ where: { userId: USER_ID, source: 'manual' } });
  const delTasks = await p.task.deleteMany({ where: { userId: USER_ID, status: 'pending' } });
  console.log(`  Deleted ${delBlocks.count} blocks, ${delTasks.count} tasks`);

  console.log('\nCreating anchors and tasks...');
  let totalBlocks = 0, totalTasks = 0;

  totalBlocks += await createAnchors('Mon', monAnchors);
  totalTasks += await createTasks('Mon', monTasks, 0);
  totalBlocks += await createAnchors('Tue', tueAnchors);
  totalTasks += await createTasks('Tue', tueTasks, 1);
  totalBlocks += await createAnchors('Wed', wedAnchors);
  totalTasks += await createTasks('Wed', wedTasks, 2);
  totalBlocks += await createAnchors('Thu', thuAnchors);
  totalTasks += await createTasks('Thu', thuTasks, 3);
  totalBlocks += await createAnchors('Fri', friAnchors);
  totalTasks += await createTasks('Fri', friTasks, 4);
  totalBlocks += await createAnchors('Sat', satAnchors);
  totalTasks += await createTasks('Sat', satTasks, 5);
  totalBlocks += await createAnchors('Sun', sunAnchors);
  totalTasks += await createTasks('Sun', sunTasks, 6);

  console.log(`\n✅ Done. Total: ${totalBlocks} blocks, ${totalTasks} tasks`);

} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
} finally {
  await p.$disconnect();
}
