@echo off
chcp 65001 >nul
title Projector Music Visualizer
cd /d "%~dp0"

echo ===================================================================
echo   🌟 PROJECTOR MUSIC VISUALIZER 🌟
echo ===================================================================
echo.
echo [1/2] Подготовка окна проектора...

start /b cmd /c "ping 127.0.0.1 -n 3 >nul && (if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3060) else (start http://localhost:3060))"

echo [2/2] Запуск сервера захвата звука (WASAPI Loopback)...
echo.

python server.py
pause
