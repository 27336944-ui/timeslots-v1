@echo off
wsl -d Ubuntu-26.04 -- bash -c "tail -30 /var/log/postgresql/postgresql-18-main.log"
