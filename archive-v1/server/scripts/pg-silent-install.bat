@echo off
echo Running EDB PostgreSQL installer in unattended mode...
cd /d C:\pg-installer
pg-installer.exe --mode unattended --superpassword timeslots_dev --prefix "C:\Program Files\PostgreSQL\18" --datadir "C:\Program Files\PostgreSQL\18\data" --servicename postgresql-x64-18 --disable-stack-builder 1 --extract-only 0
echo Install exit code: %ERRORLEVEL%
