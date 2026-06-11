@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'createdb timeslots_dev' 2>&1"
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -l' 2>&1 | head -15"
