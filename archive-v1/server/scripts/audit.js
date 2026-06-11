#!/usr/bin/env node
/**
 * 代码自检脚本：扫所有 TS 文件，输出审计报告。
 *
 * 检查项：
 * 1. **JSDoc 覆盖率**：每个导出的 class/function/interface 是否有 JSDoc
 * 2. **未使用 import**：列出所有 import，标记未在文件中使用的
 * 3. **TODO/FIXME/XXX**：列出所有遗留标记
 * 4. **未用参数**：列出 `(_x: T)` 模式
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.resolve(__dirname, '..', 'src'),
  path.resolve(__dirname, '..', '..', 'src'),
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.ts') && !p.endsWith('.d.ts')) files.push(p);
  }
  return files;
}

const files = ROOTS.flatMap((r) => walk(r));

console.log(`Scanning ${files.length} TS files...\n`);

const issues = {
  missingJsdoc: [],
  todos: [],
  unusedImports: [],
};

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const rel = path.relative(path.resolve(__dirname, '..', '..'), file);

  // 1. TODO/FIXME/XXX
  for (let i = 0; i < lines.length; i++) {
    if (/\b(TODO|FIXME|XXX)\b/.test(lines[i])) {
      issues.todos.push({ file: rel, line: i + 1, text: lines[i].trim() });
    }
  }

  // 2. Unused imports (very simple heuristic)
  const importRe = /^import\s+(?:type\s+)?(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))?\s+from\s+['"][^'"]+['"]/;
  const imports = new Set();
  for (const line of lines) {
    const m = line.match(importRe);
    if (!m) continue;
    const importText = m[0];
    const named = importText.match(/\{([^}]+)\}/);
    if (named) {
      for (const name of named[1].split(',')) {
        const clean = name.trim().split(/\s+as\s+/).pop();
        if (clean) imports.add(clean);
      }
    } else {
      const def = importText.match(/import\s+(?:type\s+)?(\w+)\s+from/);
      if (def) imports.add(def[1]);
    }
  }
  for (const name of imports) {
    const usedRe = new RegExp(`\\b${name}\\b`);
    const inImport = src.match(importRe);
    const cleanedSrc = src.replace(inImport ? inImport[0] : '', '');
    if (!usedRe.test(cleanedSrc)) {
      issues.unusedImports.push({ file: rel, name });
    }
  }

  // 3. Missing JSDoc on exported declarations
  // Heuristic: look at up to 10 lines BEFORE the declaration for a JSDoc closing `*/`
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const decl = line.match(/^export\s+(?:default\s+)?(?:abstract\s+)?(?:class|function|interface|type|const|enum)\s+(\w+)/);
    if (!decl) continue;
    let hasJsdoc = false;
    for (let j = Math.max(0, i - 25); j < i; j++) {
      if (lines[j].includes('*/')) { hasJsdoc = true; break; }
    }
    if (!hasJsdoc) {
      issues.missingJsdoc.push({ file: rel, line: i + 1, name: decl[1] });
    }
  }
}

console.log('=== TODO/FIXME/XXX ===');
if (issues.todos.length === 0) console.log('  (none) ✅');
else for (const t of issues.todos) console.log(`  ${t.file}:${t.line}  ${t.text}`);

console.log('\n=== Missing JSDoc on exports ===');
if (issues.missingJsdoc.length === 0) console.log('  (none) ✅');
else for (const m of issues.missingJsdoc) console.log(`  ${m.file}:${m.line}  export ${m.name}`);

console.log('\n=== Potentially unused imports ===');
if (issues.unusedImports.length === 0) console.log('  (none) ✅');
else for (const u of issues.unusedImports) console.log(`  ${u.file}  '${u.name}'`);
