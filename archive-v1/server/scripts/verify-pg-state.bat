@echo off
chcp 65001 >nul
echo === PG service status ===
sc query postgresql-x64-18 2>&1 | findstr STATE
echo === pg_isready ===
"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5432
echo === Test from Node ===
cd /d C:\Users\xwhy7\timeslots-v1\server
node scripts\pg-test-new-pw.js
