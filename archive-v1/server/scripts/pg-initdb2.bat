@echo off
set PG=C:\Program Files\PostgreSQL\18
set PGDATA=C:\pg-data
echo === Init data dir at %PGDATA% ===
"%PG%\bin\initdb.exe" -D "%PGDATA%" -U postgres --auth=trust --encoding=UTF8 --locale=C 2>&1
echo === Init exit: %ERRORLEVEL% ===
