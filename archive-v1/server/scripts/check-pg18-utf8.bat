@echo off
chcp 65001 >nul
echo === PG 18 install contents ===
dir "C:\Program Files\PostgreSQL\18"
echo === lib dir ===
dir "C:\Program Files\PostgreSQL\18\lib" | findstr "\.dll$" | findstr /i "snowball plpgsql"
