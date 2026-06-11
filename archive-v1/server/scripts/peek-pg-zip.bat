@echo off
echo === pg.zip (243 bytes) ===
type C:\pg-zip\pg.zip
echo === pg2.zip first 500 bytes ===
powershell -Command "Get-Content C:\pg-zip\pg2.zip -TotalCount 5 -Encoding Byte | ForEach-Object { Write-Host -NoNewline ([char]$_) }" 2>&1
echo ---
echo === pg2.zip last 100 bytes ===
powershell -Command "Get-Content C:\pg-zip\pg2.zip -Tail 10 -Encoding Byte | ForEach-Object { Write-Host -NoNewline ([char]$_) }" 2>&1
