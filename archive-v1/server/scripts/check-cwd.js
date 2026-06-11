const fs = require('fs');
console.log('cwd:', process.cwd());
const dirs = ['.', '..'];
dirs.forEach(d => {
  try {
    console.log(d, '→', fs.readdirSync(d));
  } catch (e) {
    console.log(d, 'ERR', e.message);
  }
});
