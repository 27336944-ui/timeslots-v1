#!/bin/bash
# scripts/verify-batch1.sh
# timeslots-v1 M1 Batch 1 一键验证脚本（macOS / Linux / Git Bash / WSL）
#
# 用法（在仓库根）：
#   bash scripts/verify-batch1.sh
#
# 验证范围同 verify-batch1.ps1

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAILED=0

header() { echo ""; echo "===== $1 ====="; }
pass() { echo -e "\033[32m[OK]\033[0m   $1"; }
warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
fail() { echo -e "\033[31m[FAIL]\033[0m $1"; FAILED=1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

# 1. JSON 校验
header "1/7 Validate JSON config files"
if ! node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
    fail "package.json invalid JSON"
else
    PKG_NAME=$(node -p "require('./package.json').name")
    PKG_VER=$(node -p "require('./package.json').version")
    if [ "$PKG_NAME" = "timeslots-v1" ]; then
        pass "package.json name=timeslots-v1, version=$PKG_VER"
    else
        fail "package.json name=$PKG_NAME (expected timeslots-v1)"
    fi
fi

if node -e "
const c = require('./project.config.json');
if (c.miniprogramRoot !== 'src/') { console.error('miniprogramRoot:', c.miniprogramRoot); process.exit(1); }
if (c.libVersion !== '3.3.0') { console.error('libVersion:', c.libVersion); process.exit(2); }
if (!c.setting.useCompilerPlugins || !c.setting.useCompilerPlugins.includes('typescript')) { console.error('useCompilerPlugins:', c.setting.useCompilerPlugins); process.exit(3); }
" 2>&1; then
    pass "project.config.json: miniprogramRoot=src/, libVersion=3.3.0, useCompilerPlugins=[typescript]"
else
    fail "project.config.json invalid"
fi

if node -e "
const t = require('./tsconfig.json');
if (!t.compilerOptions.strict) process.exit(1);
if (!t.compilerOptions.types.includes('miniprogram-api-typings')) process.exit(2);
" 2>&1; then
    pass "tsconfig.json: strict=true, types includes miniprogram-api-typings"
else
    fail "tsconfig.json invalid"
fi

# 2. docker-compose 语法
header "2/7 Validate docker-compose.yml"
if has_cmd docker-compose; then
    if docker-compose config -q 2>&1; then
        pass "docker-compose.yml valid"
    else
        fail "docker-compose config failed"
    fi
else
    warn "docker-compose not installed, skip"
fi

# 3. npm install
header "3/7 npm install (root)"
if has_cmd npm; then
    if npm install --no-audit --no-fund 2>&1 | tail -3; then
        pass "node_modules created"
    else
        fail "npm install failed"
    fi
else
    fail "npm not installed"
fi

# 4. docker up
header "4/7 Start Docker containers"
if has_cmd docker-compose; then
    if docker-compose up -d 2>&1 | tail -5; then
        pass "containers up"
    else
        fail "docker-compose up failed"
    fi
else
    warn "docker-compose not available, skip DB steps"
fi

# 5. wait healthy
header "5/7 Wait for Postgres healthy"
if has_cmd docker; then
    RETRIES=12
    HEALTHY=false
    while [ $RETRIES -gt 0 ]; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' timeslots-postgres 2>/dev/null || echo "missing")
        if [ "$STATUS" = "healthy" ]; then
            pass "Postgres healthy after ~$((12 - RETRIES)) * 5s"
            HEALTHY=true
            break
        fi
        RETRIES=$((RETRIES - 1))
        [ $RETRIES -gt 0 ] && sleep 5
    done
    [ "$HEALTHY" = "true" ] || fail "Postgres not healthy after 60s"
else
    warn "docker not available, skip"
fi

# 6. PG connection
header "6/7 Verify Postgres connection"
if has_cmd docker; then
    if docker exec timeslots-postgres psql -U timeslots -d timeslots -c "SELECT 1;" 2>&1 | grep -q "^ 1$"; then
        pass "SELECT 1 returned OK"
    else
        fail "psql connection failed"
    fi
else
    warn "docker not available, skip"
fi

# 7. tsc
header "7/7 tsc --noEmit (frontend TS check)"
if has_cmd npx; then
    TSC_OUT=$(npx tsc --noEmit 2>&1)
    TSC_EXIT=$?
    if [ $TSC_EXIT -eq 0 ]; then
        pass "no TS errors"
    else
        fail "tsc found errors:"
        echo "$TSC_OUT" | sed 's/^/  /'
    fi
else
    fail "npx not installed"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "\033[32m===== BATCH 1: ALL PASSED =====\033[0m"
    echo "Next: open WeChat dev tools -> import this folder -> build npm"
    exit 0
else
    echo -e "\033[31m===== BATCH 1: SOME STEPS FAILED =====\033[0m"
    exit 1
fi
