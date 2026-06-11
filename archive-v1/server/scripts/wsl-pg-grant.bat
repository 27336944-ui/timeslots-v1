@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -c \"GRANT ALL PRIVILEGES ON DATABASE timeslots_dev TO timeslots;\"' 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -c \"ALTER DATABASE timeslots_dev OWNER TO timeslots;\"' 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -d timeslots_dev -c \"GRANT ALL ON SCHEMA public TO timeslots;\"' 2>&1"
