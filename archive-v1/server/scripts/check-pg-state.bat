@echo off
echo === Check data dir ===
if exist "C:\Program Files\PostgreSQL\18\data" (
  echo DATA_DIR_EXISTS
  dir "C:\Program Files\PostgreSQL\18\data" | findstr "PG_VERSION postgresql.conf"
) else (
  echo DATA_DIR_MISSING
)
echo === Check if PG running ===
tasklist /FI "IMAGENAME eq postgres.exe" 2>&1
echo === Try pg_ctl status ===
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" status 2>&1
