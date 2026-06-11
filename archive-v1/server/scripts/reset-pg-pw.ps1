# Self-elevating script: edit pg_hba.conf to set trust auth, restart service, change postgres password, then revert
$ErrorActionPreference = 'Stop'

$pgHbaPath = 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf'
$pgConfPath = 'C:\Program Files\PostgreSQL\18\data\postgresql.conf'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$serviceName = 'postgresql-x64-18'
$newPassword = 'timeslots_dev'

# 1. Backup pg_hba.conf
$backupPath = "$pgHbaPath.bak-$(Get-Date -Format 'HHmmss')"
Copy-Item $pgHbaPath $backupPath
Write-Host "Backup: $backupPath"

# 2. Read current pg_hba.conf
$content = Get-Content $pgHbaPath
Write-Host "=== Original pg_hba.conf (last 15 lines) ==="
$content | Select-Object -Last 15

# 3. Replace host all all 127.0.0.1/32 scram-sha-256 -> trust
#    Replace host all all ::1/128 scram-sha-256 -> trust
$newContent = $content -replace '(\s+)(scram-sha-256|md5)', '$1trust'
Set-Content -Path $pgHbaPath -Value $newContent
Write-Host "=== Updated pg_hba.conf (last 15 lines) ==="
(Get-Content $pgHbaPath | Select-Object -Last 15) | ForEach-Object { Write-Host $_ }

# 4. Reload PG service
Write-Host "=== Restarting service ==="
Restart-Service $serviceName -Force
Start-Sleep -Seconds 3

# 5. Test connection with trust auth
$env:PGPASSWORD = $newPassword
Write-Host "=== Connecting to PG with psql ==="
& "$pgBin\psql.exe" -U postgres -h localhost -d postgres -c "SELECT version();" 2>&1

# 6. Change password
Write-Host "=== Setting password ==="
& "$pgBin\psql.exe" -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';" 2>&1

# 7. Create dev DB if not exists
$dbExists = & "$pgBin\psql.exe" -U postgres -h localhost -d postgres -tA -c "SELECT 1 FROM pg_database WHERE datname = 'timeslots_dev'"
if ($dbExists -ne '1') {
  Write-Host "=== Creating timeslots_dev DB ==="
  & "$pgBin\psql.exe" -U postgres -h localhost -d postgres -c "CREATE DATABASE timeslots_dev;" 2>&1
} else {
  Write-Host "=== timeslots_dev already exists ==="
}

# 8. Restore pg_hba.conf
Copy-Item $backupPath $pgHbaPath -Force
Remove-Item $backupPath
Write-Host "=== Restored pg_hba.conf ==="

# 9. Reload service
Restart-Service $serviceName -Force
Start-Sleep -Seconds 3
Write-Host "=== Service restarted, final check ==="
& "$pgBin\pg_isready.exe" -h localhost -p 5432
