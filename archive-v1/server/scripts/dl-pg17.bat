@echo off
cd /d C:\pg-installer
echo Downloading EDB PG 17.10...
curl -L -o pg17-installer.exe "https://get.enterprisedb.com/postgresql/postgresql-17.10-1-windows-x64.exe" --max-time 240 -s -w "HTTP_CODE:%{http_code} SIZE:%{size_download}\n"
echo Done. Files:
dir
