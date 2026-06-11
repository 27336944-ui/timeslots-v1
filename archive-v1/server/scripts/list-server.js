const cp = require('child_process');
const out = cp.execSync('dir "C:\\Users\\xwhy7\\timeslots-v1\\server"', { encoding: 'utf8' });
console.log(out);
