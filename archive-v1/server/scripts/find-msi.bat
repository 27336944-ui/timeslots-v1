@echo off
dir /S "C:\Program Files\PostgreSQL\18\installer" 2>&1
echo ---
echo === Look for MSI in C:\
dir /S "C:\Program Files\PostgreSQL\18\*.msi" 2>&1
echo === Look for dict_snowball anywhere ===
powershell -Command "Get-ChildItem C:\ -Recurse -Filter 'dict_snowball*' -ErrorAction SilentlyContinue 2>&1 | Select-Object FullName | Select-Object -First 5" 2>&1
