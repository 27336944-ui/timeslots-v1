@echo off
wsl -d Ubuntu-26.04 -- bash -c "ip -4 addr show eth0 | grep -oP 'inet \K[\d.]+' && echo --- && cat /etc/resolv.conf 2>&1 | grep nameserver"
