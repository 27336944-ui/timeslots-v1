@echo off
wsl -d Ubuntu-26.04 -- bash -c "PATH=\"/mnt/c/Program Files/nodejs:\$PATH\" node --version; PATH=\"/mnt/c/Program Files/nodejs:\$PATH\" npx --version"
