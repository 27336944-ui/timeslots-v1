@echo off
chcp 65001 >nul
echo === Read pg_hba.conf via runas (will trigger UAC) ===
powershell -Command "$psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = 'powershell'; $psi.Arguments = '-Command \"Get-Content C:\Program Files\PostgreSQL\18\data\pg_hba.conf\"'; $psi.Verb = 'runas'; $psi.UseShellExecute = $true; [System.Diagnostics.Process]::Start($psi) | Out-Null; 'UAC triggered'"
