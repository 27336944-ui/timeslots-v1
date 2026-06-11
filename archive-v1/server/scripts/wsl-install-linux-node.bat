@echo off
wsl -d Ubuntu-26.04 -- bash -c "cd /tmp && tar -xf node.tar.xz && mv node-v20.19.0-linux-x64 /opt/node && /opt/node/bin/node --version && /opt/node/bin/npm --version"
