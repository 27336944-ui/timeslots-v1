@echo off
echo === wsl --status ===
wsl --status
echo === wsl.conf ===
wsl -d Ubuntu-26.04 -- bash -c "cat /etc/wsl.conf 2>&1 || echo NO_WSL_CONF"
echo === /etc/resolv.conf ===
wsl -d Ubuntu-26.04 -- bash -c "cat /etc/resolv.conf"
echo === host check ===
wsl -d Ubuntu-26.04 -- bash -c "ip route show default"
echo === Windows ipconfig (Linux side) ===
wsl -d Ubuntu-26.04 -- bash -c "cat /proc/net/route | head -5"
