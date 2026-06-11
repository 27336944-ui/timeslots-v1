# Try full EDB install with all flags
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\pg-installer\pg-installer.exe"
$psi.Arguments = "--mode unattended --superpassword timeslots_dev --prefix `"C:\Program Files\PostgreSQL\18`" --datadir `"C:\Program Files\PostgreSQL\18\data`" --servicename postgresql-x64-18 --locale C --port 5432 --install_runtimes 1 --enable_acledit 0"
$psi.Verb = "runas"
$psi.UseShellExecute = $true
$psi.WindowStyle = "Hidden"
[System.Diagnostics.Process]::Start($psi) | Out-Null
Write-Host "UAC triggered."
