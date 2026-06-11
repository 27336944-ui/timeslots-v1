@echo off
wsl -d Ubuntu-26.04 -- bash -c "ip -4 addr show eth0 | grep inet; echo ---; ss -tlnp | grep 5432; echo ---; netstat -tlnp 2>/dev/null | grep 5432"
