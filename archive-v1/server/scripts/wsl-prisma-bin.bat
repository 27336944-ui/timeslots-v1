@echo off
wsl -d Ubuntu-26.04 -- bash -c "ls /mnt/c/Users/xwhy7/timeslots-v1/server/node_modules/.bin/ 2>&1 | head -5; echo ---; ls /mnt/c/Users/xwhy7/timeslots-v1/server/node_modules/.bin/prisma* 2>&1"
