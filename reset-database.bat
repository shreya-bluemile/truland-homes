@echo off
rem Rebuilds the local database from scratch (all local data is replaced with the sample data).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\windows\reset-database.ps1"
pause
