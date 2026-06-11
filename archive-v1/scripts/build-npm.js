const fs = require('fs');
const path = require('path');

// __dirname is scripts/, so project root is one level up
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules');
const DST = path.join(ROOT, 'src', 'miniprogram_npm');

const packages = [
  {
    name: 'mobx-miniprogram-bindings',
    main: 'dist/index.js',
    copy: ['dist/index.js', 'dist/index.js.map'],
  },
  {
    name: 'mobx-miniprogram',
    main: 'dist/index.js',      // re-export file
    copy: [
      'dist/index.js',
      'dist/mobx.cjs.production.min.js',
      'dist/mobx.cjs.development.js',
      'dist/mobx.d.ts',
      'dist/errors.d.ts',
      'dist/internal.d.ts',
      'dist/api',
      'dist/core',
      'dist/types',
      'dist/utils',
    ],
  },
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const pkg of packages) {
  for (const file of pkg.copy) {
    const srcPath = path.join(SRC, pkg.name, file);
    const dstPath = path.join(DST, pkg.name, file);
    if (srcPath.endsWith('dist')) {
      // skip if it's just the directory entry in the list
      continue;
    }
    try {
      copyRecursive(srcPath, dstPath);
    } catch (e) {
      // copy directory already handled by copyRecursive
    }
  }
}

// also copy mobx.cjs.production.min.js as index.js for direct require
const mobxDistPath = path.join(SRC, 'mobx-miniprogram', 'dist');
const mobxDstPath = path.join(DST, 'mobx-miniprogram', 'dist');
if (!fs.existsSync(mobxDstPath)) fs.mkdirSync(mobxDstPath, { recursive: true });
fs.copyFileSync(
  path.join(mobxDistPath, 'mobx.cjs.production.min.js'),
  path.join(mobxDstPath, 'mobx.cjs.production.min.js'),
);
fs.copyFileSync(
  path.join(mobxDistPath, 'index.js'),
  path.join(mobxDstPath, 'index.js'),
);

console.log('[build-npm] Done: miniprogram_npm/ created');
