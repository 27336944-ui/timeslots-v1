#!/usr/bin/env node
/**
 * NestJS server 停止脚本。
 *
 * 读取 `.server.pid` 文件，发送 SIGKILL 终止进程。
 */
const fs = require('fs');
const path = require('path');

const PID_FILE = path.resolve(__dirname, '..', '.server.pid');

if (!fs.existsSync(PID_FILE)) {
  console.log('No .server.pid found. Server not running via start-server.js?');
  process.exit(0);
}

const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
if (!pid || isNaN(pid)) {
  console.log('Invalid PID in .server.pid. Cleaning up.');
  fs.unlinkSync(PID_FILE);
  process.exit(0);
}

try {
  process.kill(pid, 'SIGKILL');
  console.log(`Killed server PID ${pid}`);
} catch (e) {
  console.log(`Server PID ${pid} not running: ${e.message}`);
}

fs.unlinkSync(PID_FILE);
