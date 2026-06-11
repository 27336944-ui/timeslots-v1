@echo off
echo === Try EDB zip ===
mkdir C:\pg-zip 2>nul
cd /d C:\pg-zip
curl -L -o pg.zip "https://get.enterprisedb.com/postgresql/postgresql-18.4-1-windows-x64.zip" --max-time 300 -s -w "HTTP_CODE:%{http_code} SIZE:%{size_download}\n"
echo === Try alt URL ===
curl -L -o pg2.zip "https://get.enterprisedb.com/postgresql/postgresql-18.4-1-windows-x64-binaries.zip" --max-time 300 -s -w "HTTP_CODE:%{http_code} SIZE:%{size_download}\n"
echo === Files ===
dir
