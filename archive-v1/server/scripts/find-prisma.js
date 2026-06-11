const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const found = [];
function walk(dir, depth = 0) {
  if (depth > 5) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name === 'schema.prisma' || e.name === 'migration_lock.toml') {
      found.push(p);
    }
  }
}

walk('C:\\Users\\xwhy7');
console.log('=== schema.prisma + migration_lock.toml found ===');
found.forEach(p => console.log(' ', p));
