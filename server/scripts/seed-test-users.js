const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teaky = await prisma.user.upsert({
    where: { id: '3cf1e60a-7d4d-446f-8d0a-59010b1790de' },
    update: { nickname: 'teaky' },
    create: { id: '3cf1e60a-7d4d-446f-8d0a-59010b1790de', nickname: 'teaky' },
  });
  const xwhy77 = await prisma.user.upsert({
    where: { id: 'addc035a-5da5-4a6b-a861-1a7186c3b686' },
    update: { nickname: 'xwhy77' },
    create: { id: 'addc035a-5da5-4a6b-a861-1a7186c3b686', nickname: 'xwhy77' },
  });
  console.log('teaky:', teaky.id);
  console.log('xwhy77:', xwhy77.id);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
