@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -d timeslots_dev' <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO timeslots;
EOF"
