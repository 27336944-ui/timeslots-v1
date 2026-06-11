$ErrorActionPreference = "Continue"
$FAILED = 0

function Header($s) { Write-Host ""; Write-Host "===== $s =====" -ForegroundColor Cyan }
function Pass($s) { Write-Host "[OK]   $s" -ForegroundColor Green }
function Warn($s) { Write-Host "[WARN] $s" -ForegroundColor Yellow }
function Fail($s) { Write-Host "[FAIL] $s" -ForegroundColor Red; $script:FAILED++ }

Header "1/5 Validate file structure"
$expected = @(
    "src\app.ts",
    "src\app.json",
    "src\app.wxss",
    "src\sitemap.json",
    "src\utils\request.ts",
    "src\utils\storage.ts",
    "src\utils\promisify.ts",
    "src\types\api.ts",
    "src\types\global.d.ts"
)
$existingStubs = @(
    "src\services\cloud-storage.ts",
    "src\services\llm.ts"
)
$missing = $expected | Where-Object { -not (Test-Path $_) }
$stubMissing = $existingStubs | Where-Object { -not (Test-Path $_) }
if ($missing.Count -eq 0 -and $stubMissing.Count -eq 0) {
    Pass "all 9 new files + 2 existing stubs present"
} else {
    if ($missing.Count -gt 0) { Fail "missing new files: $($missing -join ', ')" }
    if ($stubMissing.Count -gt 0) { Fail "missing stub files: $($stubMissing -join ', ')" }
}

Header "2/5 Validate src\app.json"
$appJson = Get-Content "src\app.json" -Encoding UTF8 -Raw | ConvertFrom-Json
if ($appJson.pages -and $appJson.pages.Count -gt 0) {
    Pass "app.json pages = $($appJson.pages -join ', ')"
} else {
    Fail "no pages in app.json"
}
if ($appJson.sitemapLocation) {
    Pass "has sitemapLocation = $($appJson.sitemapLocation)"
} else {
    Fail "missing sitemapLocation"
}
if (Test-Path "src\$($appJson.sitemapLocation)") {
    Pass "sitemap.json file exists"
} else {
    Fail "sitemap.json referenced but not found"
}

Header "3/5 Forbidden pattern scan (Taro/React/DOM zero-tolerance)"
$forbidden = @(
    @{ p = 'Taro'; label = 'Taro framework' },
    @{ p = '@tarojs'; label = '@tarojs/* import' },
    @{ p = 'useState'; label = 'React useState' },
    @{ p = 'useEffect'; label = 'React useEffect' },
    @{ p = 'localStorage'; label = 'browser localStorage' },
    @{ p = 'window\.'; label = 'window.* DOM API' },
    @{ p = 'document\.'; label = 'document.* DOM API' }
)
$srcFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.wxml", "*.json", "*.wxss" -ErrorAction SilentlyContinue
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
    Pass "no forbidden patterns in src/"
} else {
    Fail "$($violations.Count) forbidden pattern(s) found:"
    $violations | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

Header "4/5 tsc --noEmit (frontend)"
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
    Fail "tsc not found at $tscPath, run npm install first"
}

Header "5/5 Golden code regression check"
$compPath = "examples\component-template\index.ts"
if (Test-Path $compPath) {
    $compContent = Get-Content $compPath -Encoding UTF8 -Raw
    if ($compContent -match "Component<[^>]*,[^>]*>") {
        Pass "examples/component-template has Component generic"
    } else {
        Fail "examples/component-template lost its generic syntax (re-apply the fix)"
    }
} else {
    Warn "examples/component-template missing (skipped regression check)"
}

Write-Host ""
if ($FAILED -eq 0) {
    Write-Host "===== BATCH 3: ALL PASSED =====" -ForegroundColor Green
    Write-Host "Next: Batch 4 (pages/index + .gitkeep placeholders)" -ForegroundColor Cyan
} else {
    Write-Host "===== BATCH 3: $FAILED FAILED =====" -ForegroundColor Red
    exit 1
}
