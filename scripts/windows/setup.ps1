# One-time setup of the Truland Homes app on Windows.
#
# Creates Desktop\truland-homes, downloads private copies of PHP 8.3, Composer, Node.js 22 and
# MariaDB into Desktop\truland-homes\.tools (nothing is installed system-wide), installs all
# dependencies, creates and seeds the database, writes the .env files and starts the app.
#
# Safe to run again: finished steps are skipped.
#
# Run from PowerShell:
#   irm https://raw.githubusercontent.com/shreya-bluemile/truland-homes/main/scripts/windows/setup.ps1 | iex

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is many times faster without the progress bar
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$RepoUrl        = 'https://github.com/shreya-bluemile/truland-homes.git'
$RepoZipUrl     = 'https://github.com/shreya-bluemile/truland-homes/archive/refs/heads/main.zip'
$PhpUrl         = 'https://windows.php.net/downloads/releases/latest/php-8.3-nts-Win32-vs16-x64-latest.zip'
$ComposerUrl    = 'https://getcomposer.org/download/latest-stable/composer.phar'
$MariaDbVersion = '10.11.10'
$MariaDbUrl     = "https://archive.mariadb.org/mariadb-$MariaDbVersion/winx64-packages/mariadb-$MariaDbVersion-winx64.zip"
$VcRedistUrl    = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
$DbPort         = 3307   # not 3306, so it never clashes with a MySQL you may already have

$Root  = Join-Path ([Environment]::GetFolderPath('Desktop')) 'truland-homes'
$Tools = Join-Path $Root '.tools'
$Temp  = Join-Path $env:TEMP 'truland-setup'

function Step([string]$Message) { Write-Host ''; Write-Host "==> $Message" -ForegroundColor Cyan }
function Done([string]$Message) { Write-Host "    $Message" -ForegroundColor Green }

function Get-File([string]$Url, [string]$OutFile) {
    Write-Host "    Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
}

# Extracts a zip and moves its single top-level folder to $Destination.
function Expand-Into([string]$Zip, [string]$Destination) {
    $unpack = Join-Path $Temp ([IO.Path]::GetRandomFileName())
    Expand-Archive -Path $Zip -DestinationPath $unpack -Force
    $items = @(Get-ChildItem $unpack)
    $source = if ($items.Count -eq 1 -and $items[0].PSIsContainer) { $items[0].FullName } else { $unpack }
    Move-Item -Path $source -Destination $Destination
}

function Invoke-Checked([string]$What, [scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit code $LASTEXITCODE). See the messages above." }
}

function Set-EnvValue([string]$File, [string]$Key, [string]$Value) {
    $lines = Get-Content $File
    $found = $false
    $lines = $lines | ForEach-Object {
        if ($_ -match "^#?\s*$Key=") { $found = $true; "$Key=$Value" } else { $_ }
    }
    if (-not $found) { $lines = @($lines) + "$Key=$Value" }
    # WriteAllLines writes UTF-8 without a byte-order mark, which Laravel's .env parser requires.
    [IO.File]::WriteAllLines($File, [string[]]$lines)
}

try {
    New-Item -ItemType Directory -Force -Path $Temp | Out-Null

    # 1. Project code ---------------------------------------------------------------------------
    Step "Getting the project into $Root"
    if (Test-Path (Join-Path $Root '.git')) {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Invoke-Checked 'git pull' { git -C $Root pull --ff-only }
        }
        Done 'Project already downloaded.'
    } elseif (Test-Path (Join-Path $Root 'backend')) {
        Done 'Project folder already exists.'
    } elseif (Get-Command git -ErrorAction SilentlyContinue) {
        Invoke-Checked 'git clone' { git clone $RepoUrl $Root }
        Done 'Cloned from GitHub.'
    } else {
        Write-Host '    Git is not installed, so downloading the code as a zip.'
        Write-Host '    (Install Git from https://git-scm.com later if you want to pull updates with git.)'
        $zip = Join-Path $Temp 'repo.zip'
        Get-File $RepoZipUrl $zip
        Expand-Into $zip $Root
        Done 'Downloaded from GitHub.'
    }
    New-Item -ItemType Directory -Force -Path $Tools | Out-Null

    # 2. PHP 8.3 --------------------------------------------------------------------------------
    Step 'PHP 8.3'
    $phpDir = Join-Path $Tools 'php'
    $php = Join-Path $phpDir 'php.exe'
    if (-not (Test-Path $php)) {
        $zip = Join-Path $Temp 'php.zip'
        Get-File $PhpUrl $zip
        New-Item -ItemType Directory -Force -Path $phpDir | Out-Null
        Expand-Archive -Path $zip -DestinationPath $phpDir -Force

        # Enable the extensions Laravel needs and allow larger uploads (quotation documents).
        $ini = Get-Content (Join-Path $phpDir 'php.ini-development') -Raw
        $ini = $ini -replace ';\s*extension_dir\s*=\s*"ext"', 'extension_dir = "ext"'
        foreach ($ext in 'curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_mysql', 'pdo_sqlite', 'sqlite3', 'zip') {
            $ini = $ini -replace ";extension=$ext(\r?\n)", "extension=$ext`$1"
        }
        $ini = $ini -replace 'upload_max_filesize\s*=\s*\d+M', 'upload_max_filesize = 20M'
        $ini = $ini -replace 'post_max_size\s*=\s*\d+M', 'post_max_size = 100M'
        Set-Content -Path (Join-Path $phpDir 'php.ini') -Value $ini -Encoding ASCII
    }
    $env:PATH = "$phpDir;$env:PATH"
    # Windows PowerShell 5.1 treats redirected stderr as an error, so only stdout is discarded here.
    & $php -v | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host '    PHP needs the Microsoft Visual C++ runtime. Installing it (Windows may ask for permission)...'
        $vc = Join-Path $Temp 'vc_redist.x64.exe'
        Get-File $VcRedistUrl $vc
        Start-Process -FilePath $vc -ArgumentList '/install', '/passive', '/norestart' -Wait
        & $php -v | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'PHP still does not run after installing the Visual C++ runtime. Restart Windows and run setup again.' }
    }
    Done ((& $php -r 'echo "PHP " . PHP_VERSION;'))

    # 3. Composer -------------------------------------------------------------------------------
    Step 'Composer'
    $composer = Join-Path $Tools 'composer.phar'
    if (-not (Test-Path $composer)) { Get-File $ComposerUrl $composer }
    Done 'Composer ready.'

    # 4. Node.js 22 -----------------------------------------------------------------------------
    Step 'Node.js 22'
    $nodeDir = Join-Path $Tools 'node'
    if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) {
        $release = Invoke-RestMethod 'https://nodejs.org/dist/index.json' |
            Where-Object { $_.version -like 'v22.*' -and $_.files -contains 'win-x64-zip' } |
            Select-Object -First 1
        if (-not $release) { throw 'Could not find a Node.js 22 download.' }
        $v = $release.version
        $zip = Join-Path $Temp 'node.zip'
        Get-File "https://nodejs.org/dist/$v/node-$v-win-x64.zip" $zip
        Expand-Into $zip $nodeDir
    }
    $env:PATH = "$nodeDir;$env:PATH"
    Done ("Node " + (& (Join-Path $nodeDir 'node.exe') -v))

    # 5. MariaDB (MySQL-compatible database) ------------------------------------------------------
    Step "MariaDB $MariaDbVersion (port $DbPort)"
    $dbDir = Join-Path $Tools 'mariadb'
    $dbData = Join-Path $Tools 'mariadb-data'
    if (-not (Test-Path (Join-Path $dbDir 'bin'))) {
        $zip = Join-Path $Temp 'mariadb.zip'
        Get-File $MariaDbUrl $zip
        Expand-Into $zip $dbDir
    }
    $dbBin = Join-Path $dbDir 'bin'
    function Find-Bin([string[]]$Names) {
        foreach ($n in $Names) { $p = Join-Path $dbBin $n; if (Test-Path $p) { return $p } }
        throw "Could not find $($Names -join ' / ') in $dbBin."
    }
    if (-not (Test-Path $dbData)) {
        $installDb = Find-Bin @('mariadb-install-db.exe', 'mysql_install_db.exe')
        Invoke-Checked 'Creating the database files' { & $installDb "--datadir=$dbData" }
    }
    & (Join-Path $Root 'scripts\windows\start.ps1') -DatabaseOnly
    $mariadb = Find-Bin @('mariadb.exe', 'mysql.exe')
    Invoke-Checked 'Creating the truland database' {
        & $mariadb -uroot -h127.0.0.1 "--port=$DbPort" -e 'CREATE DATABASE IF NOT EXISTS truland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
    }
    Done 'Database "truland" ready.'

    # 6. Backend (Laravel) ------------------------------------------------------------------------
    Step 'Backend: installing PHP packages and setting up the database'
    $backend = Join-Path $Root 'backend'
    Push-Location $backend
    try {
        Invoke-Checked 'composer install' { & $php $composer install --no-interaction }
        $envFile = Join-Path $backend '.env'
        if (-not (Test-Path $envFile)) {
            Copy-Item (Join-Path $backend '.env.example') $envFile
            Set-EnvValue $envFile 'DB_HOST' '127.0.0.1'
            Set-EnvValue $envFile 'DB_PORT' "$DbPort"
            Set-EnvValue $envFile 'DB_DATABASE' 'truland'
            Set-EnvValue $envFile 'DB_USERNAME' 'root'
            Set-EnvValue $envFile 'DB_PASSWORD' ''
        }
        if (-not (Select-String -Path $envFile -Pattern '^APP_KEY=base64:' -Quiet)) {
            Invoke-Checked 'Generating the app key' { & $php artisan key:generate --force }
        }
        Invoke-Checked 'Database migration' { & $php artisan migrate --seed --force }
        if (-not (Test-Path (Join-Path $backend 'public\storage'))) {
            # Optional (only needed for publicly served files), so a failure here does not stop setup.
            try { & $php artisan storage:link | Out-Null } catch { Write-Host '    Skipped storage:link.' }
        }
    } finally { Pop-Location }
    Done 'Backend ready.'

    # 7. Frontend (React) -------------------------------------------------------------------------
    Step 'Frontend: installing JavaScript packages'
    $frontend = Join-Path $Root 'frontend'
    Push-Location $frontend
    try {
        Invoke-Checked 'npm install' { & (Join-Path $nodeDir 'npm.cmd') install --no-audit --no-fund }
        if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
    } finally { Pop-Location }
    Done 'Frontend ready.'

    # 8. Start ------------------------------------------------------------------------------------
    Step 'Starting the app'
    & (Join-Path $Root 'scripts\windows\start.ps1')

    Write-Host ''
    Write-Host 'Setup complete.' -ForegroundColor Green
    Write-Host "Project folder: $Root"
    Write-Host 'Next time, just double-click start.bat in that folder.'
} catch {
    Write-Host ''
    Write-Host "SETUP STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Fix the problem above (or send this message to your developer) and run setup again;'
    Write-Host 'steps that already finished will be skipped.'
}
