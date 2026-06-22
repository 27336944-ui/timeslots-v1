const os = require('os');
const fs = require('fs');
const path = require('path');

const interfaces = os.networkInterfaces();
let lanIp = 'localhost';

// Prefer 192.168.x.x LAN, fallback to 10.x.x.x
for (const pref of ['192.168', '10.']) {
  outer:
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith(pref)) {
        lanIp = net.address;
        break outer;
      }
    }
  }
  if (lanIp !== 'localhost') break;
}

const configPath = path.join(__dirname, '..', 'src', 'utils', 'config.ts');
let content = fs.readFileSync(configPath, 'utf8');
const oldLine = content.match(/^const DEV_URL = .*$/m);
if (oldLine) {
  const newLine = `const DEV_URL = 'http://${lanIp}:7777';`;
  content = content.replace(oldLine[0], newLine);
  fs.writeFileSync(configPath, content, 'utf8');
  console.log(`DEV_URL: ${oldLine[0]} → ${newLine}`);

  // Also writes an .env file so a local HTTP helper could serve it
  const envPath = path.join(__dirname, '..', '.detected-ip');
  fs.writeFileSync(envPath, lanIp, 'utf8');
  console.log(`Detected IP written to .detected-ip: ${lanIp}`);
  console.log('Tip: On the mini program settings page, open "开发设置" and set the server URL manually if changing WiFi.');
} else {
  console.error('Could not find DEV_URL line in config.ts');
  process.exit(1);
}
