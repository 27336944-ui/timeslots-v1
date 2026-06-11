// Debug P2023 error
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error', 'warn', 'query'] });
(async () => {
  try {
    const u = await p.user.findUnique({ where: { id: 'u_test001' } });
    console.log('user findUnique:', u);
  } catch (e) {
    console.log('user FAIL:', e.code, e.message);
  }
  try {
    const c = await p.timeBlock.create({
      data: {
        userId: 'u_test001',
        title: 't',
        startTime: new Date('2026-06-08T10:00:00Z'),
        endTime: new Date('2026-06-08T11:00:00Z'),
        nature: 'PRIVATE',
      },
    });
    console.log('create OK:', c.id);
  } catch (e) {
    console.log('create FAIL code:', e.code);
    console.log('create FAIL meta:', JSON.stringify(e.meta));
    console.log('create FAIL message:', e.message);
  }
  await p.$disconnect();
})();
