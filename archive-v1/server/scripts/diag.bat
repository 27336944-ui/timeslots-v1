@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -c \"SHOW server_version; SHOW listen_addresses;\"' 2>&1"
echo === check Windows Defender firewall rules blocking 5432 ===
netsh advfirewall firewall show rule name=all 2>&1 | findstr /I "5432" 2>&1 | head -10
echo === check if any local PG ===
where psql 2>&1
