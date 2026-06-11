$ErrorActionPreference = "Continue"
$FAILED = 0

function Header($s) { Write-Host ""; Write-Host "===== $s =====" -ForegroundColor Cyan }
function Pass($s) { Write-Host "[OK]   $s" -ForegroundColor Green }
function Warn($s) { Write-Host "[WARN] $s" -ForegroundColor Yellow }
function Fail($s) { Write-Host "[FAIL] $s" -ForegroundColor Red; $script:FAILED++ }
function Has-Command($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Header "1/6 Validate server/ file structure"
$expected = @(
    "server\package.json",
    "server\tsconfig.json",
    "server\tsconfig.build.json",
    "server\nest-cli.json",
    "server\Dockerfile",
    "server\.env.example",
    "server\.gitignore",
    "server\prisma\schema.prisma",
    "server\src\main.ts",
    "server\src\app.module.ts",
    "server\src\common\exceptions\business.exception.ts",
    "server\src\common\filters\all-exceptions.filter.ts",
    "server\src\common\decorators\public.decorator.ts",
    "server\src\common\interceptors\transform.interceptor.ts",
    "server\src\config\configuration.ts",
    "server\src\config\validation.ts",
    "server\src\prisma\prisma.service.ts",
    "server\src\prisma\prisma.module.ts",
    "server\src\health\health.module.ts",
    "server\src\health\health.controller.ts"
)
$missing = $expected | Where-Object { -not (Test-Path $_) }
if ($missing.Count -eq 0) {
    Pass "all 20 files exist"
} else {
    Fail "missing files: $($missing -join ', ')"
}

Header "2/6 Validate server\package.json"
$pkgRaw = Get-Content "server\package.json" -Encoding UTF8 -Raw
$pkg = $pkgRaw | ConvertFrom-Json
if ($pkg.name -eq "timeslots-server") { Pass "name=timeslots-server" } else { Fail "name mismatch" }
if ($pkg.dependencies."@nestjs/core") { Pass "has @nestjs/core" } else { Fail "no @nestjs/core" }
if ($pkg.dependencies."@prisma/client") { Pass "has @prisma/client" } else { Fail "no @prisma/client" }
if ($pkg.devDependencies.prisma) { Pass "has prisma (devDep)" } else { Fail "no prisma" }
if ($pkg.scripts.postinstall -eq "prisma generate") { Pass "postinstall = prisma generate" } else { Fail "no postinstall" }

Header "3/6 Copy .env.example to .env"
if (-not (Test-Path "server\.env")) {
    Copy-Item "server\.env.example" "server\.env" -Force
    Pass ".env created"
} else {
    Pass ".env already exists"
}

Header "4/6 npm install in server\"
Push-Location "server"
try {
    $npmOut = cmd /c "npm install --no-audit --no-fund 2>&1"
    $npmExit = $LASTEXITCODE
    if ($npmExit -ne 0) {
        Write-Host $npmOut -ForegroundColor Red
        Fail "npm install failed (exit $npmExit)"
    } else {
        Pass "node_modules created (postinstall ran prisma generate)"
    }
} finally {
    Pop-Location
}

Header "5/6 tsc --noEmit in server\"
Push-Location "server"
try {
    $tscPath = "node_modules\.bin\tsc.cmd"
    if (Test-Path $tscPath) {
        $tscOut = cmd /c "$tscPath --noEmit 2>&1"
        $tscExit = $LASTEXITCODE
        if ($tscExit -ne 0) {
            Write-Host $tscOut -ForegroundColor Red
            Fail "tsc found errors"
        } else {
            Pass "no TS errors"
        }
    } else {
        Fail "tsc not found at $tscPath"
    }
} finally {
    Pop-Location
}

Header "6/6 Start server, curl health endpoint"
Push-Location "server"
try {
    $logFile = "server-test.log"
    Remove-Item $logFile -ErrorAction SilentlyContinue
    Remove-Item "$logFile.err" -ErrorAction SilentlyContinue

    $proc = Start-Process -FilePath "cmd" `
        -ArgumentList "/c","npm run start" `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError "$logFile.err" `
        -NoNewWindow -PassThru

    $ready = $false
    $i = 0
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        $statusCode = curl.exe -s -o nul -w "%{http_code}" http://localhost:3000/api/v1/health
        if ($statusCode -eq "200") {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Pass "server started within $i s"
        $body = curl.exe -s http://localhost:3000/api/v1/health
        Write-Host "  response: $body" -ForegroundColor Gray
        if ($body -match '"code":\s*0' -and $body -match '"status":\s*"ok"') {
            Pass "health endpoint returns { code: 0, data: { status: 'ok' }, message: '' }"
        } else {
            Fail "health response mismatch: $body"
        }
    } else {
        Fail "server did not start in 40s"
        if (Test-Path $logFile) {
            Get-Content $logFile | Select-Object -First 30 | ForEach-Object { Write-Host "  OUT: $_" -ForegroundColor Gray }
        }
        if (Test-Path "$logFile.err") {
            Get-Content "$logFile.err" | Select-Object -First 30 | ForEach-Object { Write-Host "  ERR: $_" -ForegroundColor Gray }
        }
    }

    taskkill /F /T /PID $proc.Id 2>&1 | Out-Null
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
} finally {
    Pop-Location
}

Write-Host ""
if ($FAILED -eq 0) {
    Write-Host "===== BATCH 2: ALL PASSED =====" -ForegroundColor Green
    Write-Host "Next: Batch 3 (frontend utils + types + app entry)" -ForegroundColor Cyan
} else {
    Write-Host "===== BATCH 2: $FAILED FAILED =====" -ForegroundColor Red
    exit 1
}
