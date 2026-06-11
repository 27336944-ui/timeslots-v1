Add-Type -AssemblyName System.Diagnostics
$nodes = Get-Process -Name node -ErrorAction SilentlyContinue
foreach ($n in $nodes) {
  Write-Host "PID $($n.Id)  PPID $($n.Parent.Id)  StartTime $($n.StartTime)  CPU $($n.CPU)"
  try { Write-Host "   CMD: $($n.CommandLine)" } catch { Write-Host "   CMD: <access denied>" }
}
