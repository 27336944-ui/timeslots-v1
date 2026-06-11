@echo off
wsl -d Ubuntu-26.04 -- bash -c "apt-cache search postgresql 2>&1 | head -30"
