const fs = require('fs');
const paths = [
  'C:\\Users\\xwhy7\\timeslots-v1\\server\\prisma',
  'C:\\Users\\xwhy7\\timeslots-v1\\server\\prisma\\migrations',
  'C:\\Users\\xwhy7\\timeslots-v1\\server\\prisma\\migrations\\20260607115654_init',
  'C:\\Users\\xwhy7\\timeslots-v1\\server\\prisma\\schema.prisma',
];
paths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(p, exists ? 'EXISTS' : 'NOT FOUND');
  if (exists && fs.statSync(p).isDirectory()) {
    console.log('  →', fs.readdirSync(p));
  }
});
