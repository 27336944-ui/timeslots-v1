@echo off
wsl -d Ubuntu-26.04 -- bash -c "ip -4 addr show eth0 | grep -oP 'inet \K[\d.]+'"
