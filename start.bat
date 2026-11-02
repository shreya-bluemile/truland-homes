@echo off
REM Starts the database, API and frontend, then opens the app in your browser.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\start.ps1"
pause
