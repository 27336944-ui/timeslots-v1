@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -d timeslots_dev -c \"\\\\dt\"'"
