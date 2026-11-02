@echo off
rem Shares the running app over the internet with a temporary link (keep this window open).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\windows\share.ps1"
pause
