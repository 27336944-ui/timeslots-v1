@echo off
echo === 1. Install postgresql-18 ===
wsl -d Ubuntu-26.04 -- bash -c "DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-18 postgresql-client-18 2>&1 | tail -10"
echo === 2. Start service ===
wsl -d Ubuntu-26.04 -- bash -c "pg_lsclusters 2>&1 && service postgresql start 2>&1 || pg_ctlcluster 18 main start 2>&1"
echo === 3. Verify ===
wsl -d Ubuntu-26.04 -- bash -c "pg_lsclusters 2>&1 && su postgres -c 'psql -c \"SELECT version();\"' 2>&1 | head -5"
