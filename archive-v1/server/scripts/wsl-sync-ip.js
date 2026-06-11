#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getWslIp() {
  try {
    const out = execSync('wsl -d Ubuntu-26.04 -- bash -c "ip -4 addr show eth0 | grep -oP \'inet \\K[\\d.]+\'"', { encoding: 'utf8' });
    return out.trim();
  } catch (e) {
    throw new Error('Cannot get WSL IP: ' + e.message);
  }
}

const ip = getWslIp();
if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
  throw new Error('Invalid WSL IP: ' + ip);
}
console.log('WSL2 eth0 IP:', ip);

const envPath = path.resolve(__dirname, '..', '.env');
let env = fs.readFileSync(envPath, 'utf8');
const newUrl = `postgresql://postgres:timeslots_dev@${ip}:5432/timeslots_dev?schema=public`;
const updated = env.replace(
  /DATABASE_URL=.*/,
  `DATABASE_URL=${newUrl}`
);
if (updated === env) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
fs.writeFileSync(envPath, updated);
console.log('✅ .env updated with DATABASE_URL pointing to', ip);
