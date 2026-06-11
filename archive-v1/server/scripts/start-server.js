#!/usr/bin/env node
/**
 * NestJS server 启动器（detached 模式）。
 *
 * 与 `npm run start` 区别：
 * - 用 Node.js `spawn` 启动子进程（**`detached: true` + `stdio: ignore`**）
 * - 子进程**完全脱离父进程**——父进程退出时不会被回收
 * - PID 写入 `.server.pid` 文件，便于后续清理
 * - 启动后立即返回（不等 server 启动完成）
 *
 * 配合 `scripts/stop-server.js` 使用可彻底清理。
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.resolve(__dirname, '..', '.server.pid');
const LOG_FILE = path.resolve(__dirname, '..', 'server.log');

if (fs.existsSync(PID_FILE)) {
  const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
  if (oldPid && !isNaN(oldPid)) {
    try {
      process.kill(oldPid, 0);
      console.log(`Old server still running (PID ${oldPid}). Killing...`);
      process.kill(oldPid, 'SIGKILL');
    } catch {
      // not running
    }
    fs.unlinkSync(PID_FILE);
  }
}

const out = fs.openSync(LOG_FILE, 'a');
const err = fs.openSync(LOG_FILE, 'a');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['nest', 'start'],
  {
    cwd: path.resolve(__dirname, '..'),
    detached: true,
    stdio: ['ignore', out, err],
    shell: true,
  },
);

child.unref();

fs.writeFileSync(PID_FILE, String(child.pid));
console.log(`Server started in background, PID: ${child.pid}`);
console.log(`Log: ${LOG_FILE}`);
console.log(`Stop: node scripts/stop-server.js`);
