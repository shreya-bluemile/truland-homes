# Rebuilds the local database from scratch: drops every table, recreates them for the
# current version of the code, and loads the sample data again.
# Use it when the database no longer matches the code (for example after switching versions)
# or when you want a clean slate. ALL LOCAL DATA IS REPLACED.
# Usage: double-click reset-database.bat in the project folder.

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Tools = Join-Path $Root '.tools'
$env:PATH = "$Tools\php;$Tools\node;$Tools\mariadb\bin;$env:PATH"

Write-Host ''
Write-Host 'This rebuilds the local database for the current version of the code.' -ForegroundColor Cyan
Write-Host 'All quotations, contractors and settings on THIS COMPUTER are replaced with the sample data.' -ForegroundColor Yellow
$answer = Read-Host 'Type YES to continue'
if ($answer -ne 'YES') { Write-Host 'Nothing was changed.'; exit 0 }

# Make sure the database server is running (starts it if needed).
& (Join-Path $Root 'scripts\windows\start.ps1') -DatabaseOnly

Push-Location (Join-Path $Root 'backend')
try {
    & php artisan migrate:fresh --seed --force
    if ($LASTEXITCODE -ne 0) { throw "artisan exited with code $LASTEXITCODE" }
    Write-Host ''
    Write-Host 'Database rebuilt. Start the app with start.bat (or refresh your browser if it is running).' -ForegroundColor Green
} catch {
    Write-Host ''
    Write-Host "DATABASE RESET FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Send this message to your developer.' -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
