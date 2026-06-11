@echo off
wsl -d Ubuntu-26.04 -- bash -c "cat /etc/os-release; echo '---'; uname -a; echo '---'; sudo -n true 2>&1 || echo SUDO_NEEDED; echo '---'; whoami"
