# Starts the Truland Homes app on Windows: database, Laravel API and React frontend.
# Each part runs in its own window. Close those windows to stop the app.
# Usage: double-click start.bat in the project folder.
param([switch]$DatabaseOnly)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Tools = Join-Path $Root '.tools'
$DbPort = 3307

# Use the project's own copies of PHP, Node and MariaDB first.
$env:PATH = "$Tools\php;$Tools\node;$Tools\mariadb\bin;$env:PATH"

function Test-Port([int]$Port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect('localhost', $Port)
        $client.Close()
        return $true
    } catch { return $false }
}

function Wait-Port([int]$Port, [int]$Seconds, [string]$Name) {
    for ($i = 0; $i -lt $Seconds; $i++) {
        if (Test-Port $Port) { return }
        Start-Sleep -Seconds 1
    }
    throw "$Name did not start on port $Port within $Seconds seconds. Check its window for the error."
}

function Find-MariaDbExe([string[]]$Names) {
    foreach ($name in $Names) {
        $path = Join-Path "$Tools\mariadb\bin" $name
        if (Test-Path $path) { return $path }
    }
    throw "MariaDB is missing from $Tools\mariadb. Run setup again."
}

try {
    if (-not (Test-Port $DbPort)) {
        Write-Host 'Starting the database...'
        $mariadbd = Find-MariaDbExe @('mariadbd.exe', 'mysqld.exe')
        Start-Process -FilePath $mariadbd -WindowStyle Minimized -ArgumentList @(
            "--datadir=`"$Tools\mariadb-data`"", "--port=$DbPort", '--console'
        )
        Wait-Port $DbPort 60 'The database'
    }
    Write-Host "Database running on port $DbPort." -ForegroundColor Green
    if ($DatabaseOnly) { return }

    if (-not (Test-Port 8000)) {
        Write-Host 'Starting the API...'
        Start-Process cmd -ArgumentList '/k', "title Truland API && cd /d `"$Root\backend`" && php artisan serve --host=127.0.0.1 --port=8000"
        Wait-Port 8000 60 'The API'
    }
    Write-Host 'API running at http://127.0.0.1:8000' -ForegroundColor Green

    if (-not (Test-Port 5173)) {
        Write-Host 'Starting the frontend...'
        Start-Process cmd -ArgumentList '/k', "title Truland Frontend && cd /d `"$Root\frontend`" && npm run dev"
        Wait-Port 5173 120 'The frontend'
    }
    Write-Host 'App running at http://localhost:5173' -ForegroundColor Green

    Start-Process 'http://localhost:5173'
    Write-Host ''
    Write-Host 'Sign in with admin@trulandhomes.com.au / password'
    Write-Host 'To stop the app, close the database (minimised), "Truland API" and "Truland Frontend" windows.'
} catch {
    Write-Host ''
    Write-Host "Could not start the app: $($_.Exception.Message)" -ForegroundColor Red
    if ($DatabaseOnly) { throw }
}
