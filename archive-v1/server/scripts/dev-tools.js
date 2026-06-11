#!/usr/bin/env node
/**
 * NestJS dev workflow 工具脚本。
 *
 * 子命令：
 * - `node scripts/dev-tools.js check [port]`  → 查端口是否被占用
 * - `node scripts/dev-tools.js free [port]`   → 杀掉占用该端口的进程
 * - `node scripts/dev-tools.js scan`          → 扫 7000-9000 推荐空闲端口
 *
 * 设计目标：
 * 1. **幂等**：重复运行结果一致
 * 2. **跨平台**：纯 Node.js + 命令行（不依赖 PowerShell 脚本）
 * 3. **零外部依赖**：只读 `net` / `child_process` / `os`
 *
 * 解决 `EADDRINUSE` 反复出现的问题：开发期间被前一轮 nest start
 * 残留进程占用同一端口时，先调用 `free` 子命令清理再启动。
 */
const { execSync } = require('child_process');
const net = require('net');

const DEFAULT_PORT = 7777;

function findPidsOnPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      const m = line.match(/\s(\d+)$/);
      if (m && line.includes('LISTENING')) {
        pids.add(m[1]);
      }
    }
    return [...pids];
  } catch {
    return [];
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '0.0.0.0');
  });
}

async function findFreePort(start = 7000, end = 9000) {
  for (let p = start; p <= end; p++) {
    if (await isPortFree(p)) return p;
  }
  return null;
}

function killPids(pids) {
  const killed = [];
  const failed = [];
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
      killed.push(pid);
    } catch (e) {
      failed.push({ pid, err: e.message });
    }
  }
  return { killed, failed };
}

function printUsage() {
  console.log(`dev-tools.js — NestJS dev workflow helper

Usage:
  node scripts/dev-tools.js check [port]    Check if port is free (default: 7777)
  node scripts/dev-tools.js free  [port]    Kill all processes on the port
  node scripts/dev-tools.js scan            Find first free port in 7000-9000
  node scripts/dev-tools.js cleanup         Kill all node.exe processes (last resort)
`);
}

async function main() {
  const [, , cmd, arg] = process.argv;

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printUsage();
    process.exit(0);
  }

  const port = parseInt(arg ?? String(DEFAULT_PORT), 10);

  if (cmd === 'check') {
    const free = await isPortFree(port);
    const pids = free ? [] : findPidsOnPort(port);
    console.log(`Port ${port}: ${free ? 'FREE ✅' : `OCCUPIED ❌ by PIDs: ${pids.join(', ')}`}`);
    process.exit(free ? 0 : 1);
  }

  if (cmd === 'free') {
    const pids = findPidsOnPort(port);
    if (pids.length === 0) {
      console.log(`Port ${port} already free.`);
      process.exit(0);
    }
    console.log(`Killing PIDs on port ${port}: ${pids.join(', ')}`);
    const { killed, failed } = killPids(pids);
    console.log(`Killed: ${killed.join(', ')}`);
    if (failed.length) console.log(`Failed: ${JSON.stringify(failed)}`);
    const free = await isPortFree(port);
    console.log(`Port ${port}: ${free ? 'FREE ✅' : 'STILL OCCUPIED ❌'}`);
    process.exit(free ? 0 : 1);
  }

  if (cmd === 'scan') {
    const p = await findFreePort();
    console.log(p ? `First free port: ${p} ✅` : 'No free port in 7000-9000 ❌');
    process.exit(p ? 0 : 1);
  }

  if (cmd === 'cleanup') {
    console.log('Killing all node.exe processes...');
    try {
      execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
      console.log('Done.');
      process.exit(0);
    } catch (e) {
      console.log(`Some processes survived: ${e.message}`);
      process.exit(1);
    }
  }

  console.error(`Unknown command: ${cmd}`);
  printUsage();
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
