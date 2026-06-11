param([int]$KeepPid = 70496)
$procs = Get-Process node -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  if ($p.Id -ne $KeepPid) {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 2
Write-Host "Done"
