@echo off
wsl -d Ubuntu-26.04 -- bash -c "ss -tlnp | grep 5432; echo ---; psql 'postgresql://postgres:timeslots_dev@127.0.0.1:5432/timeslots_dev' -c 'SELECT 1' 2>&1"
