@echo off
wsl -d Ubuntu-26.04 -- bash -c "grep listen_addresses /etc/postgresql/18/main/postgresql.conf"
echo === changing to '*' ===
wsl -d Ubuntu-26.04 -- bash -c "sed -i \"s/^#listen_addresses.*/listen_addresses = '*'/\" /etc/postgresql/18/main/postgresql.conf"
wsl -d Ubuntu-26.04 -- bash -c "sed -i \"s/^listen_addresses.*/listen_addresses = '*'/\" /etc/postgresql/18/main/postgresql.conf"
wsl -d Ubuntu-26.04 -- bash -c "grep ^listen_addresses /etc/postgresql/18/main/postgresql.conf"
echo === restart pg ===
wsl -d Ubuntu-26.04 -- bash -c "pg_ctlcluster 18 main restart 2>&1"
echo === verify ===
wsl -d Ubuntu-26.04 -- bash -c "ss -tlnp 2>&1 | grep 5432"
