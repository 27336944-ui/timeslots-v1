@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"psql -c \\\"CREATE USER timeslots WITH PASSWORD 'timeslots_dev' SUPERUSER;\\\"\" 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"GRANT ALL PRIVILEGES ON DATABASE timeslots_dev TO timeslots;\" 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c \"psql -c \\\\\"ALTER DATABASE timeslots_dev OWNER TO timeslots;\\\\\"\" 2>&1"
