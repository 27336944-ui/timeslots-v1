@echo off
echo === Check lib dir ===
dir "C:\Program Files\PostgreSQL\18\lib" | findstr dict_snowball
echo === Check for share dir ===
dir "C:\Program Files\PostgreSQL\18\share" 2>&1 | findstr snowball
echo === Full lib contents ===
dir "C:\Program Files\PostgreSQL\18\lib" | head -20
