@echo off
mkdir C:\pg-zip\extracted 2>nul
powershell -Command "Expand-Archive -Path C:\pg-zip\pg2.zip -DestinationPath C:\pg-zip\extracted -Force" 2>&1
echo === Extracted ===
dir C:\pg-zip\extracted 2>&1
echo === Recursive ===
powershell -Command "Get-ChildItem C:\pg-zip\extracted -Recurse -Depth 2 | Select-Object FullName | Select-Object -First 30" 2>&1
