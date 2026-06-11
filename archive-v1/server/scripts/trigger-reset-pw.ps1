# Trigger UAC to run reset-pg-pw.ps1 as admin
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "powershell"
$psi.Arguments = "-ExecutionPolicy Bypass -File C:\Users\xwhy7\timeslots-v1\server\scripts\reset-pg-pw.ps1"
$psi.Verb = "runas"
$psi.UseShellExecute = $true
$psi.WindowStyle = "Hidden"
try {
  [System.Diagnostics.Process]::Start($psi) | Out-Null
  Write-Host "UAC triggered. Click 'Yes' on desktop to run reset script."
} catch {
  Write-Host "Failed: $($_.Exception.Message)"
}
