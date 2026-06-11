const fs = require('fs');
const path = require('path');
const p = path.resolve('prisma');
console.log('Resolved:', p);
console.log('Exists:', fs.existsSync(p));
if (fs.existsSync(p)) {
  console.log('Contents:', fs.readdirSync(p));
}
