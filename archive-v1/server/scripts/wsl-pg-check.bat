@echo off
wsl -d Ubuntu-26.04 -- bash -c "apt-get update 2>&1 | tail -5 && echo '=== apt-cache search ===' && apt-cache search '^postgresql-1[5-7]$' && echo '=== versions ===' && apt-cache policy postgresql-16 postgresql-17 2>&1 | head -20"
