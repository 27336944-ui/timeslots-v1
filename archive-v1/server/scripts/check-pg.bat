@echo off
if exist "C:\Program Files\PostgreSQL\18" (
  echo PG18_INSTALLED
  dir "C:\Program Files\PostgreSQL\18\bin" | findstr "psql pg_ctl"
) else (
  echo PG18_NOT_INSTALLED
)
if exist "C:\Program Files\PostgreSQL\17" (
  echo PG17_INSTALLED
) else (
  echo PG17_NOT_INSTALLED
)
if exist "C:\Program Files\PostgreSQL\16" (
  echo PG16_INSTALLED
) else (
  echo PG16_NOT_INSTALLED
)
echo === Services ===
sc query postgresql-x64-18 2>&1
sc query postgresql-x64-17 2>&1
sc query postgresql-x64-16 2>&1
