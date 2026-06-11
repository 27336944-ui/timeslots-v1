@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD 'timeslots_dev';\\\"\" 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"createdb timeslots_dev\\\"\" 2>&1 || echo DB_EXISTS"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"psql -c '\\\\l'\" 2>&1 | head -20"
echo === listen_addresses check ===
wsl -d Ubuntu-26.04 -- bash -c "grep -E '^(listen_addresses|port)' /etc/postgresql/18/main/postgresql.conf"
echo === pg_hba.conf ===
wsl -d Ubuntu-26.04 -- bash -c "tail -10 /etc/postgresql/18/main/pg_hba.conf"
