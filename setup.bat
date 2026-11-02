@echo off
REM One-time setup: downloads PHP, Composer, Node.js and MariaDB into .tools, installs everything and starts the app.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\setup.ps1"
pause
