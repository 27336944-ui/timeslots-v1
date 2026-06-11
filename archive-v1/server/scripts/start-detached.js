// Detached server starter (no npx) — use direct nest binary
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverCwd = path.resolve(__dirname, '..');
const logPath = path.join(serverCwd, 'server.log');
const nestBin = path.join(serverCwd, 'node_modules', '.bin', 'nest.cmd');

const out = fs.openSync(logPath, 'a');
const err = fs.openSync(logPath, 'a');

console.log('Spawning:', nestBin, 'start in', serverCwd);
const child = spawn(
  'cmd.exe',
  ['/c', 'cd', '/d', serverCwd, '&&', nestBin, 'start'],
  {
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
    env: { ...process.env, FORCE_COLOR: '0' },
    cwd: serverCwd,
  }
);
child.unref();
console.log(`Server started detached, PID: ${child.pid}`);

// Write pid file
fs.writeFileSync(path.join(serverCwd, '.server.pid'), String(child.pid));
console.log('Wrote .server.pid');
