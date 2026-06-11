const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const npmDir = path.join(srcDir, 'miniprogram_npm');
const nodeModulesDir = path.join(__dirname, '..', 'node_modules');

const packages = [
  { name: 'mobx-miniprogram', miniprogram: 'miniprogram_dist' },
  { name: 'mobx-miniprogram-bindings', miniprogram: 'dist' },
  { name: 'weui-miniprogram', miniprogram: 'miniprogram_dist' },
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

if (!fs.existsSync(npmDir)) {
  fs.mkdirSync(npmDir, { recursive: true });
}

for (const pkg of packages) {
  const pkgRoot = path.join(nodeModulesDir, pkg.name);
  if (!fs.existsSync(pkgRoot)) {
    console.warn(`Warning: ${pkg.name} not found in node_modules`);
    continue;
  }

  const dest = path.join(npmDir, pkg.name);
  copyDir(pkgRoot, dest);
  console.log(`Copied ${pkg.name} to miniprogram_npm/`);
}
