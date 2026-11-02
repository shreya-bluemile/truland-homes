# Shares the app over the internet with a temporary link, using a free Cloudflare quick tunnel.
# The link works for as long as this window stays open and the app keeps running on this computer.
# Usage: double-click share.bat in the project folder.

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Tools = Join-Path $Root '.tools'
$CloudflaredUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'

# 1. Make sure the app itself is running (starts anything that isn't).
& (Join-Path $Root 'scripts\windows\start.ps1')

# 2. Get the tunnel program (one-time ~60 MB download).
$exe = Join-Path $Tools 'cloudflared.exe'
if (-not (Test-Path $exe)) {
    Write-Host 'Downloading the sharing tool (one time only)...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing -Uri $CloudflaredUrl -OutFile $exe
}

# 3. Open the tunnel. Cloudflared prints the public link; keep this window open while sharing.
Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ' Your share link will appear below, on a line like' -ForegroundColor Cyan
Write-Host '   https://something-random.trycloudflare.com' -ForegroundColor Yellow
Write-Host ' Copy that link and send it to the person.' -ForegroundColor Cyan
Write-Host ''
Write-Host ' Keep this window open while they look at the app.' -ForegroundColor Cyan
Write-Host ' Close this window to stop sharing.' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ''
& $exe tunnel --no-autoupdate --url http://localhost:5173
