const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  log: ['error', 'warn'],
});
(async () => {
  try {
    const users = await p.user.findMany();
    console.log('OK users:', users.length);
    const quotas = await p.quota.findMany();
    console.log('OK quotas:', quotas.length);
    const blocks = await p.timeBlock.findMany();
    console.log('OK time_blocks:', blocks.length);
  } catch (e) {
    console.log('FAIL:', e.code || e.name, '-', (e.message || '').slice(0, 300));
  } finally {
    await p.$disconnect();
  }
})();
