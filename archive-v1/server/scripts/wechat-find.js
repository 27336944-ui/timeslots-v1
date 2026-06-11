const fs = require('fs');
const { execSync } = require('child_process');

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function listDir(p) { try { return fs.readdirSync(p); } catch { return null; } }

console.log('=== Tencent folder ===');
const t1 = 'C:\\Program Files\\Tencent';
const t2 = 'C:\\Program Files\\com.tencent.pcgame.tenweixinkaifazhegongju';
[t1, t2].forEach(p => {
  if (exists(p)) {
    console.log(p, '✅');
    listDir(p).forEach(n => console.log('  ', n));
  } else {
    console.log(p, '❌');
  }
});

console.log('\n=== WeChat dev tools code/ ===');
const code = t2 + '\\code';
if (exists(code)) {
  listDir(code).forEach(n => {
    const p = code + '\\' + n;
    if (fs.statSync(p).isDirectory()) {
      console.log('  DIR  ', n);
    } else if (n.endsWith('.exe')) {
      console.log('  EXE  ', n, fs.statSync(p).size, 'bytes');
    } else {
      console.log('  FILE ', n);
    }
  });
}

console.log('\n=== package.nw structure ===');
const nw = code + '\\package.nw';
if (exists(nw)) {
  console.log(nw, '✅');
  listDir(nw).forEach(n => console.log('  ', n));
}

console.log('\n=== Look for WeChatCLI / wechatdevtools ===');
const candidates = [
  code + '\\微信开发者工具.exe',
  code + '\\WechatDevtools.exe',
  code + '\\WeChatDevtools.exe',
  code + '\\wechatdevtools.exe',
  code + '\\cli.bat',
  code + '\\bin',
  code + '\\bin\\wechat-devtools-cli.exe',
];
candidates.forEach(p => console.log(p, exists(p) ? '✅' : '❌'));

console.log('\n=== WSL distros ===');
try {
  const wslOut = execSync('wsl --list --verbose', { encoding: 'utf8', stdio: 'pipe' });
  console.log(wslOut);
} catch (e) {
  console.log('ERR:', e.message.split('\n')[0]);
}
