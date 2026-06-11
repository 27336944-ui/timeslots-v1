@echo off
echo === Try extracting MSI files from EDB installer ===
cd /d C:\pg-installer
mkdir msi-extract 2>nul
pg-installer.exe --mode unattended --superpassword timeslots_dev --extract-msi "C:\pg-installer\msi-extract" 2>&1
echo Exit: %ERRORLEVEL%
echo === Extracted files ===
dir C:\pg-installer\msi-extract 2>&1
