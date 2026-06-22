@echo off
REM 一键创建桌面快捷方式和开机自启
cd /d "%~dp0"

echo [1/3] 创建桌面快捷方式...
cscript //nologo create-desktop-link.vbs
echo.

echo [2/3] 设置开机自启...
cscript //nologo setup-autostart.vbs
echo.

echo [3/3] 验证...
if exist "%USERPROFILE%\Desktop\Timeslots v1.lnk" (
    echo ✓ 桌面快捷方式: %USERPROFILE%\Desktop\Timeslots v1.lnk
) else (
    echo ✗ 桌面快捷方式创建失败
)

set "STARTUP_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Timeslots v1.lnk"
if exist "%STARTUP_PATH%" (
    echo ✓ 开机自启: %STARTUP_PATH%
) else (
    echo ✗ 开机自启创建失败
)

echo.
echo 全部完成！双击桌面上的 "Timeslots v1" 即可启动后端。
echo 前端请在「微信开发者工具」中打开 src/ 目录。
echo.
pause
