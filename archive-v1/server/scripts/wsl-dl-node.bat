@echo off
wsl -d Ubuntu-26.04 -- bash -c "cd /tmp && curl -fsSL https://nodejs.org/dist/v20.19.0/node-v20.19.0-linux-x64.tar.xz -o node.tar.xz 2>&1 | tail -3 && ls -la node.tar.xz"
