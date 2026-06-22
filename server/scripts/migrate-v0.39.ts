import { PrismaClient } from '@prisma/client';

interface StepsJson {
  text: string;
  isDone: boolean;
}

const prisma = new PrismaClient();

async function migrateSteps(): Promise<void> {
  const allTasks = await prisma.task.findMany();
  const tasks = allTasks.filter((t) => t.steps !== null);

  let migrated = 0;
  let skipped = 0;

  for (const task of tasks) {
    const stepsData = task.steps as unknown as StepsJson[] | null;
    if (!stepsData || !Array.isArray(stepsData) || stepsData.length === 0) {
      skipped++;
      continue;
    }

    const existingCount = await prisma.step.count({ where: { taskId: task.id } });
    if (existingCount > 0) {
      skipped++;
      continue;
    }

    for (let i = 0; i < stepsData.length; i++) {
      const s = stepsData[i];
      await prisma.step.create({
        data: {
          taskId: task.id,
          sortOrder: i,
          text: s.text,
          status: s.isDone ? 'done' : 'pending',
          completedAt: s.isDone ? new Date() : null,
        },
      });
    }
    migrated++;
  }

  console.log(`迁移完成：${migrated} 个任务的步骤已迁移，${skipped} 个跳过（无数据或已迁移）`);
}

async function main(): Promise<void> {
  console.log('v0.39 数据迁移开始...');
  await migrateSteps();
  console.log('v0.39 数据迁移完成');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('迁移失败:', err);
  prisma.$disconnect();
  process.exit(1);
});
