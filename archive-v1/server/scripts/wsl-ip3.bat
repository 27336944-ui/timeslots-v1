@echo off
wsl -d Ubuntu-26.04 -- bash -c "hostname -I; echo ---; ip -4 addr show eth0"
