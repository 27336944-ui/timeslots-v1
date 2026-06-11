@echo off
echo === Check for 7z ===
where 7z 2>&1
where 7za 2>&1
where expand 2>&1
echo === Try with PowerShell Expand-Archive ===
powershell -Command "Get-Command 7z* 2>&1; Get-Command Expand-Archive 2>&1"
