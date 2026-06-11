const fs = require('fs');
const { execSync } = require('child_process');

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function listDir(p) { try { return fs.readdirSync(p); } catch { return null; } }
function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim(); }
  catch (e) { return `ERR: ${e.message.split('\n')[0]}`; }
}

console.log('=== Installed apps in C:\\Program Files ===');
const pf = listDir('C:\\Program Files') || [];
console.log(pf.filter(n => /Docker|tencent|Postgres|Microsoft|Google|Mozilla|Adobe/i.test(n)).join('\n'));

console.log('\n=== Docker folder ===');
const dockerFolder = listDir('C:\\Program Files\\Docker');
console.log(dockerFolder ? dockerFolder.join('\n') : 'NOT FOUND');

console.log('\n=== Docker CLI ===');
const dockerCLIs = [
  'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
  'C:\\Program Files\\Docker\\Docker\\cli.exe',
  'C:\\Program Files\\Docker\\Docker\\docker.exe',
];
dockerCLIs.forEach(p => console.log(p, exists(p) ? '✅' : '❌'));

console.log('\n=== WeChat dev tools ===');
const wx = 'C:\\Program Files\\com.tencent.pcgame.tenweixinkaifazhegongju';
if (exists(wx)) {
  console.log(wx, '✅');
  const code = listDir(wx + '\\code');
  console.log('code/', code ? code.join(', ') : 'NULL');
  // Look for .exe
  const candidates = [
    wx + '\\code\\微信开发者工具.exe',
    wx + '\\code\\WeChat DevTools.exe',
    wx + '\\code\\wechatdevtools.exe',
    wx + '\\code\\cli.bat',
  ];
  candidates.forEach(p => console.log(p, exists(p) ? '✅' : '❌'));
}

console.log('\n=== Postgres ===');
['C:\\Program Files\\PostgreSQL', 'C:\\Program Files (x86)\\PostgreSQL'].forEach(p => {
  console.log(p, exists(p) ? '✅' : '❌');
  if (exists(p)) console.log('  ', listDir(p).join(', '));
});

console.log('\n=== Package managers ===');
['winget', 'choco', 'scoop'].forEach(c => {
  const r = run(`${c} --version 2>&1`);
  console.log(c, r.startsWith('ERR') ? '❌' : '✅', r);
});

console.log('\n=== WSL ===');
const wsl = run('wsl --status 2>&1');
console.log(wsl.length > 200 ? wsl.slice(0, 200) + '...' : wsl);

console.log('\n=== PATH docker ===');
const pathEnv = process.env.PATH || '';
const pathDirs = pathEnv.split(';');
const dockerInPath = pathDirs.filter(d => /docker/i.test(d));
console.log('Docker in PATH:', dockerInPath.length ? dockerInPath.join('; ') : 'NONE');
