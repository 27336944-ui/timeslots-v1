@echo off
chcp 65001 >nul
echo === Install summary ===
type "C:\Program Files\PostgreSQL\18\installation_summary.log"
echo === Check service ===
sc query postgresql-x64-18 2>&1
echo === Try pg_isready ===
"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5432 2>&1
