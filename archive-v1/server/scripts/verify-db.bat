@echo off
wsl -d Ubuntu-26.04 -- bash -c "su postgres -c 'psql -d timeslots_dev -c \"\\\\dt\"'"
echo ---
dir "C:\Users\xwhy7\timeslots-v1\server\prisma\migrations\"
