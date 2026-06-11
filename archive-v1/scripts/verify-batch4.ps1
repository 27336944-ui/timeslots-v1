$ErrorActionPreference = "Continue"
$FAILED = 0

function Header($s) { Write-Host ""; Write-Host "===== $s =====" -ForegroundColor Cyan }
function Pass($s) { Write-Host "[OK]   $s" -ForegroundColor Green }
function Warn($s) { Write-Host "[WARN] $s" -ForegroundColor Yellow }
function Fail($s) { Write-Host "[FAIL] $s" -ForegroundColor Red; $script:FAILED++ }

Header "1/6 Validate file structure"
$expected = @(
    "src\pages\index\index.json",
    "src\pages\index\index.wxml",
    "src\pages\index\index.wxss",
    "src\pages\index\index.ts",
    "src\pages\todo\.gitkeep",
    "src\pages\calendar\.gitkeep",
    "src\pages\settings\.gitkeep",
    "src\components\.gitkeep",
    "src\stores\.gitkeep"
)
$missing = $expected | Where-Object { -not (Test-Path $_) }
if ($missing.Count -eq 0) {
    Pass "all 9 files present (4 page + 5 gitkeep)"
} else {
    Fail "missing files: $($missing -join ', ')"
}

Header "2/6 Validate pages/index/index.json"
$pageJson = Get-Content "src\pages\index\index.json" -Encoding UTF8 -Raw | ConvertFrom-Json
if ($pageJson.navigationBarTitleText) {
    Pass "navigationBarTitleText = $($pageJson.navigationBarTitleText)"
} else {
    Fail "missing navigationBarTitleText"
}
$appJson = Get-Content "src\app.json" -Encoding UTF8 -Raw | ConvertFrom-Json
if ($appJson.pages -contains "pages/index/index") {
    Pass "registered in src/app.json pages"
} else {
    Fail "pages/index/index not in src/app.json pages"
}

Header "3/6 Validate pages/index/index.ts (Page generic)"
$tsContent = Get-Content "src\pages\index\index.ts" -Encoding UTF8 -Raw
if ($tsContent -match "Page<[^>]+,\s*[^>]+>\(") {
    Pass "uses Page<TData, TCustom> generic (no Options API)"
} else {
    Fail "missing Page<TData, TCustom> two-generic syntax"
}
if ($tsContent -match "import\s+\{\s*request\s*\}\s+from\s+'../../utils/request'") {
    Pass "imports request from utils/request"
} else {
    Fail "missing request import"
}
if ($tsContent -match "url:\s*'/health'") {
    Pass "calls /health endpoint (M1 acceptance chain)"
} else {
    Fail "does not call /health endpoint"
}

Header "4/6 Forbidden pattern scan (Taro/React/DOM zero-tolerance)"
$forbidden = @(
    @{ p = 'Taro'; label = 'Taro framework' },
    @{ p = '@tarojs'; label = '@tarojs/* import' },
    @{ p = 'useState'; label = 'React useState' },
    @{ p = 'useEffect'; label = 'React useEffect' },
    @{ p = 'localStorage'; label = 'browser localStorage' },
    @{ p = 'window\.'; label = 'window.* DOM API' },
    @{ p = 'document\.'; label = 'document.* DOM API' }
)
$srcFiles = Get-ChildItem -Path "src\pages" -Recurse -Include "*.ts", "*.wxml", "*.json", "*.wxss" -ErrorAction SilentlyContinue
$violations = @()
foreach ($file in $srcFiles) {
    foreach ($rule in $forbidden) {
        $content = Get-Content $file.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
        $lineNum = 0
        foreach ($line in $content) {
            $lineNum++
            if ($line -match [regex]::Escape($rule.p)) {
                $violations += "$($file.Name):$lineNum : $($rule.label) -> $line"
            }
        }
    }
}
if ($violations.Count -eq 0) {
    Pass "no forbidden patterns in src/pages"
} else {
    Fail "$($violations.Count) forbidden pattern(s) found:"
    $violations | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

Header "5/6 tsc --noEmit (frontend)"
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
    Fail "tsc not found, run npm install first"
}

Header "6/6 Golden code regression check"
$checks = @(
    @{ p = "examples\page-template\index.ts"; label = "page-template" },
    @{ p = "examples\component-template\index.ts"; label = "component-template" },
    @{ p = "examples\api-call.ts"; label = "api-call" }
)
foreach ($check in $checks) {
    if (Test-Path $check.p) {
        $content = Get-Content $check.p -Encoding UTF8 -Raw
        if ($content -match "Page<" -or $content -match "Component<" -or $content -match "request<") {
            Pass "$($check.label) golden code intact"
        } else {
            Fail "$($check.label) golden code lost key syntax"
        }
    } else {
        Warn "$($check.label) missing (skipped)"
    }
}

Write-Host ""
if ($FAILED -eq 0) {
    Write-Host "===== BATCH 4: ALL PASSED =====" -ForegroundColor Green
    Write-Host "Next: M1 done! Manual smoke test in WeChat DevTools." -ForegroundColor Cyan
} else {
    Write-Host "===== BATCH 4: $FAILED FAILED =====" -ForegroundColor Red
    exit 1
}
