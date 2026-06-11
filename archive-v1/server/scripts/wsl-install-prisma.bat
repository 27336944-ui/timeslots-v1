@echo off
wsl -d Ubuntu-26.04 -- bash -c "mkdir -p /opt/prisma-wsl && cd /opt/prisma-wsl && export PATH=\"/opt/node/bin:\$PATH\" && npm init -y > /dev/null && npm install prisma@5.22.0 --no-save 2>&1 | tail -3 && ls node_modules/.bin/prisma"
