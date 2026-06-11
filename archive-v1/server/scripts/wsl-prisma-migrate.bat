@echo off
wsl -d Ubuntu-26.04 -- bash -c "export PATH=\"/opt/node/bin:\$PATH\" && cd /opt/prisma-wsl && env DATABASE_URL='postgresql://postgres:timeslots_dev@localhost:5432/timeslots_dev' npx prisma migrate dev --schema /mnt/c/Users/xwhy7/timeslots-v1/server/prisma/schema.prisma --name init 2>&1"
