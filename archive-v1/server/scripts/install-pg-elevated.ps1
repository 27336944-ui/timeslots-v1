# Install PostgreSQL 18 with elevated privileges via PowerShell Start-Process
$ProgressPreference = 'SilentlyContinue'
$winget = Get-Command winget.exe | Select-Object -ExpandProperty Source

Write-Host "Running: winget install PostgreSQL 18 (elevated)"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $winget
$psi.Arguments = 'install -e --id PostgreSQL.PostgreSQL.18 --accept-package-agreements --accept-source-agreements --silent'
$psi.Verb = 'runas'  # Trigger UAC
$psi.UseShellExecute = $true
$psi.WindowStyle = 'Hidden'

$proc = [System.Diagnostics.Process]::Start($psi)
$proc.WaitForExit(600000)  # 10 min timeout
Write-Host "ExitCode: $($proc.ExitCode)"
