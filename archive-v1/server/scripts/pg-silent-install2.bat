@echo off
echo Running EDB PostgreSQL installer with logs...
cd /d C:\pg-installer
pg-installer.exe --mode unattended --superpassword timeslots_dev --prefix "C:\Program Files\PostgreSQL\18" --datadir "C:\Program Files\PostgreSQL\18\data" --servicename postgresql-x64-18 --disable-stack-builder 1 --extract-only 0 > C:\pg-installer\install.log 2>&1
echo Exit: %ERRORLEVEL%
echo === install.log ===
type C:\pg-installer\install.log 2>&1
echo === MSI log if any ===
if exist C:\Users\xwhy7\AppData\Local\Temp\bitrock_installer*.log (
  dir C:\Users\xwhy7\AppData\Local\Temp\bitrock_installer*.log
)
if exist C:\pg-installer\pg_installer.log (
  type C:\pg-installer\pg_installer.log 2>&1
)
