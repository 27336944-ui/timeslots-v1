// Detached watch-mode starter — never kill; auto-restart on file change
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.resolve(__dirname, '..');
const logPath = path.join(cwd, 'server.log');
const nestBin = path.join(cwd, 'node_modules', '.bin', 'nest.cmd');
const pidPath = path.join(cwd, '.server.pid');

// Kill any existing server first
if (fs.existsSync(pidPath)) {
  try {
    const oldPid = Number(fs.readFileSync(pidPath, 'utf-8').trim());
    if (oldPid > 0) {
      try { process.kill(oldPid, 0); process.kill(oldPid); } catch {}
    }
  } catch {}
}

const out = fs.openSync(logPath, 'a');
const err = fs.openSync(logPath, 'a');
fs.appendFileSync(logPath, `\n=== SERVER RESTART at ${new Date().toISOString()} ===\n`);

console.log('Starting watch-mode server:', nestBin, 'start --watch in', cwd);
const child = spawn(
  'cmd.exe',
  ['/c', nestBin, 'start', '--watch'],
  {
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
    env: { ...process.env, FORCE_COLOR: '0', PORT: '7777' },
    cwd,
  }
);
child.unref();
fs.writeFileSync(pidPath, String(child.pid));
console.log(`Server PID: ${child.pid} (watch mode). Log: server.log`);
