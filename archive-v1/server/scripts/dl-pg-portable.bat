@echo off
mkdir C:\pg-portable
cd /d C:\pg-portable
echo Trying winlibs PG...
curl -L -o pg.zip "https://github.com/nicman23/winlibs-postgresql/releases/download/18.4-1/winlibs-postgresql-18.4-1-x64.zip" --max-time 120 -s -w "HTTP_CODE:%{http_code} SIZE:%{size_download}\n"
echo Done
