# scripts/verify-batch1.ps1
# timeslots-v1 M1 Batch 1 一键验证脚本（Windows PowerShell）
#
# 用法（在仓库根）：
#   powershell -ExecutionPolicy Bypass -File scripts\verify-batch1.ps1
#
# 验证范围：
#   1. JSON 配置文件语法（package.json / project.config.json / tsconfig.json）
#   2. docker-compose.yml 语法
#   3. npm install
#   4. docker-compose up -d 启动 PG + Adminer
#   5. PG 健康检查
#   6. PG 连接测试（SELECT 1）
#   7. tsc --noEmit 前端类型检查

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot

$global:Failed = $false

function Header($text) {
    Write-Host ""
    Write-Host "===== $text =====" -ForegroundColor Cyan
}

function Pass($text) {
    Write-Host "[OK]   $text" -ForegroundColor Green
}

function Warn($text) {
    Write-Host "[WARN] $text" -ForegroundColor Yellow
}

function Fail($text) {
    Write-Host "[FAIL] $text" -ForegroundColor Red
    $global:Failed = $true
}

function Has-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# 1. JSON 配置校验（强制 UTF-8 读取，避免中文乱码）
Header "1/7 Validate JSON config files"
try {
    $pkg = Get-Content "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($pkg.name -ne "timeslots-v1") { Fail "package.json name=$($pkg.name) (expected timeslots-v1)" }
    else { Pass "package.json name=timeslots-v1, version=$($pkg.version)" }
} catch { Fail "package.json: $_" }

try {
    $cfg = Get-Content "project.config.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($cfg.miniprogramRoot -ne "src/") { Fail "project.config.json miniprogramRoot should be src/" }
    else { Pass "project.config.json miniprogramRoot=src/" }
    if ($cfg.libVersion -ne "3.3.0") { Fail "project.config.json libVersion should be 3.3.0" }
    else { Pass "project.config.json libVersion=3.3.0" }
    $plugins = $cfg.setting.useCompilerPlugins
    if (-not $plugins -or $plugins -notcontains "typescript") {
        Fail "project.config.json useCompilerPlugins missing typescript"
    } else { Pass "project.config.json useCompilerPlugins=[typescript]" }
} catch { Fail "project.config.json: $_" }

try {
    $ts = Get-Content "tsconfig.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $ts.compilerOptions.strict) { Fail "tsconfig.json strict must be true" }
    else { Pass "tsconfig.json strict=true" }
    $types = $ts.compilerOptions.types
    if (-not $types -or $types -notcontains "miniprogram-api-typings") {
        Fail "tsconfig.json types must include miniprogram-api-typings"
    } else { Pass "tsconfig.json types includes miniprogram-api-typings" }
} catch { Fail "tsconfig.json: $_" }

# 2. docker-compose 语法
Header "2/7 Validate docker-compose.yml"
if (Has-Command "docker-compose") {
    $out = & docker-compose config 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "docker-compose config failed: $out" }
    elseif ($out -match "postgres" -and $out -match "adminer") {
        Pass "docker-compose.yml valid (postgres + adminer)"
    } else { Fail "docker-compose.yml missing services" }
} else { Warn "docker-compose not installed, skip" }

# 3. npm install
Header "3/7 npm install (root)"
if (Has-Command "npm") {
    $npmOut = cmd /c "npm install --no-audit --no-fund 2>&1"
    $npmExit = $LASTEXITCODE
    if ($npmExit -ne 0) {
        Write-Host ""
        Write-Host "--- npm install output ---" -ForegroundColor Red
        Write-Host $npmOut -ForegroundColor Red
        Write-Host "--------------------------" -ForegroundColor Red
        Write-Host ""
        Write-Host "--- diagnostics ---" -ForegroundColor Yellow
        $registry = cmd /c "npm config get registry 2>&1"
        Write-Host "current registry: $registry" -ForegroundColor Yellow
        $pkgCheck = cmd /c "npm view weui-miniprogram version 2>&1"
        Write-Host "latest weui-miniprogram: $pkgCheck" -ForegroundColor Yellow
        $pkgCheck2 = cmd /c "npm view miniprogram-api-typings version 2>&1"
        Write-Host "latest miniprogram-api-typings: $pkgCheck2" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "common fixes:" -ForegroundColor Yellow
        Write-Host "  1. npm install --registry https://registry.npmjs.org/" -ForegroundColor Yellow
        Write-Host "  2. npm install --registry https://registry.npmmirror.com/" -ForegroundColor Yellow
        Write-Host "  3. npm config set registry https://registry.npmmirror.com/" -ForegroundColor Yellow
        Fail "npm install failed (exit $npmExit)"
    } else {
        Pass "node_modules created"
    }
} else { Fail "npm not installed" }

# 4. Docker up
Header "4/7 Start Docker containers"
if (Has-Command "docker-compose") {
    & docker-compose up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "docker-compose up failed" }
    else { Pass "containers up" }
} else { Warn "docker-compose not available, skip remaining DB steps" }

# 5. Wait for healthy
Header "5/7 Wait for Postgres healthy"
if (Has-Command "docker") {
    $retries = 12
    $healthy = $false
    while ($retries -gt 0) {
        $status = & docker inspect --format='{{.State.Health.Status}}' timeslots-postgres 2>$null
        if ($status -eq "healthy") {
            Pass "Postgres healthy after ~$((12 - $retries) * 5)s"
            $healthy = $true
            break
        }
        $retries--
        if ($retries -gt 0) { Start-Sleep -Seconds 5 }
    }
    if (-not $healthy) { Fail "Postgres not healthy after 60s" }
} else { Warn "docker not available, skip" }

# 6. PG connection
Header "6/7 Verify Postgres connection"
if (Has-Command "docker") {
    $result = & docker exec timeslots-postgres psql -U timeslots -d timeslots -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "psql failed: $result" }
    elseif ($result -match "\b1\b") { Pass "SELECT 1 returned OK" }
    else { Fail "psql returned unexpected: $result" }
} else { Warn "docker not available, skip" }

# 7. tsc
Header "7/7 tsc --noEmit (frontend TS check)"
$tscPath = "node_modules\.bin\tsc.cmd"
if (Test-Path $tscPath) {
    $tscOut = cmd /c "$tscPath --noEmit 2>&1"
    $tscExit = $LASTEXITCODE
    if ($tscExit -ne 0) {
        Fail "tsc found errors:"
        $tscOut | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    } else { Pass "no TS errors" }
} else {
    Fail "tsc not found at $tscPath. Run npm install first."
}

Write-Host ""
if ($global:Failed) {
    Write-Host "===== BATCH 1: SOME STEPS FAILED =====" -ForegroundColor Red
    exit 1
} else {
    Write-Host "===== BATCH 1: ALL PASSED =====" -ForegroundColor Green
    Write-Host "Next: open WeChat dev tools -> import this folder -> build npm" -ForegroundColor Cyan
    exit 0
}
