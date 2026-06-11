# Trigger UAC to install PG; do NOT wait for it (user clicks UAC manually)
$ProgressPreference = 'SilentlyContinue'
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\pg-installer\pg-installer.exe"
$psi.Arguments = "--mode unattended --superpassword timeslots_dev --prefix `"C:\Program Files\PostgreSQL\18`" --datadir `"C:\Program Files\PostgreSQL\18\data`" --servicename postgresql-x64-18 --disable-stack-builder 1"
$psi.Verb = "runas"
$psi.UseShellExecute = $true
$psi.WindowStyle = "Hidden"
try {
  [System.Diagnostics.Process]::Start($psi) | Out-Null
  Write-Host "UAC triggered, PID started. Check desktop for elevation dialog."
} catch {
  Write-Host "Failed to trigger: $($_.Exception.Message)"
}
