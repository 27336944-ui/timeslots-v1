@echo off
set WSL_IP=
for /f "tokens=*" %%i in ('wsl -d Ubuntu-26.04 -- bash -c "ip -4 addr show eth0 | grep -oP 'inet \K[\d.]+'"') do set WSL_IP=%%i
echo WSL_IP=%WSL_IP%

if "%WSL_IP%"=="" (
  echo Failed to get WSL IP
  exit /b 1
)

echo Adding portproxy: 127.0.0.1:5432 -^> %WSL_IP%:5432
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=5432 connectaddress=%WSL_IP% connectport=5432
netsh interface portproxy show v4tov4 | findstr 5432

echo Setting firewall rule...
netsh advfirewall firewall add rule name="WSL2 PG 5432" dir=in action=allow protocol=TCP localport=5432 2>&1
