@echo off
wsl -d Ubuntu-26.04 -- bash -c "node --version; npm --version; which node; which npx; ls /mnt/c/Users/xwhy7/timeslots-v1/server/prisma/ 2>&1"
