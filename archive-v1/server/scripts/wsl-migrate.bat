@echo off
wsl -d Ubuntu-26.04 -- bash -c "export PATH=\"/mnt/c/Program Files/nodejs:\$PATH\" && cd /mnt/c/Users/xwhy7/timeslots-v1/server && npx prisma migrate dev --name init 2>&1"
