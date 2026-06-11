@echo off
echo === current pg_hba.conf tail ===
wsl -d Ubuntu-26.04 -- bash -c "tail -15 /etc/postgresql/18/main/pg_hba.conf"
echo === add 172.16.0.0/12 rule ===
wsl -d Ubuntu-26.04 -- bash -c "echo 'host all all 172.16.0.0/12 scram-sha-256' >> /etc/postgresql/18/main/pg_hba.conf"
echo === reload ===
wsl -d Ubuntu-26.04 -- bash -c "pg_ctlcluster 18 main reload 2>&1"
echo === verify ===
wsl -d Ubuntu-26.04 -- bash -c "tail -3 /etc/postgresql/18/main/pg_hba.conf"
