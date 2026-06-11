@echo off
wsl -d Ubuntu-26.04 -- bash -c "apt-get install -y nodejs npm 2>&1 | tail -3; node --version; npm --version"
