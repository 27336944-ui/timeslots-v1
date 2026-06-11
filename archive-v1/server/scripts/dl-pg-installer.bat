@echo off
mkdir C:\pg-installer 2>nul
cd /d C:\pg-installer
echo Downloading EDB PostgreSQL 18.4-1...
curl -L -o pg-installer.exe "https://get.enterprisedb.com/postgresql/postgresql-18.4-1-windows-x64.exe" --max-time 240 -s -w "HTTP_CODE:%{http_code} SIZE:%{size_download}\n"
echo Done. Files in C:\pg-installer:
dir
