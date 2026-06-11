@echo off
echo === installer/server ===
dir "C:\Program Files\PostgreSQL\18\installer\server"
echo === share contents ===
dir "C:\Program Files\PostgreSQL\18\share" | head -10
echo === share/extension ===
if exist "C:\Program Files\PostgreSQL\18\share\extension" (
  dir "C:\Program Files\PostgreSQL\18\share\extension" | findstr snowball
)
