# Shares the app over the internet with a temporary link, using a free Cloudflare quick tunnel.
# The link works for as long as this window stays open and the app keeps running on this computer.
# Usage: double-click share.bat in the project folder.

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Tools = Join-Path $Root '.tools'
$CloudflaredUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'

# 1. Make sure the app itself is running (starts anything that isn't).
& (Join-Path $Root 'scripts\windows\start.ps1')

# 2. Get the tunnel program (one-time download, about 55 MB). A half-finished file from an
#    interrupted earlier run is thrown away and downloaded again.
$exe = Join-Path $Tools 'cloudflared.exe'
if ((Test-Path $exe) -and ((Get-Item $exe).Length -lt 30MB)) { Remove-Item $exe }
if (-not (Test-Path $exe)) {
    Write-Host 'Downloading the sharing tool (one time, about 55 MB). This can take a few minutes...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    $partial = "$exe.download"
    Invoke-WebRequest -UseBasicParsing -Uri $CloudflaredUrl -OutFile $partial
    Move-Item -Force $partial $exe
    Write-Host 'Download finished.'
}

# 3. Open the tunnel and watch its log until the public link appears.
$outLog = Join-Path $env:TEMP 'cloudflared-out.log'
$errLog = Join-Path $env:TEMP 'cloudflared-err.log'
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue
Write-Host ''
Write-Host 'Creating your share link...'
$tunnel = Start-Process -FilePath $exe -ArgumentList 'tunnel', '--no-autoupdate', '--url', 'http://localhost:5173' `
    -NoNewWindow -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog

$url = $null
foreach ($i in 1..90) {
    Start-Sleep -Seconds 1
    $text = ''
    foreach ($log in $outLog, $errLog) {
        $text += (Get-Content $log -Raw -ErrorAction SilentlyContinue)
    }
    if ($text -match 'https://[a-z0-9-]+\.trycloudflare\.com') { $url = $Matches[0]; break }
    if ($tunnel.HasExited) { break }
}

if ($url) {
    $url | Set-Content (Join-Path $Root 'share-link.txt')
    try { Set-Clipboard -Value $url } catch { $url | clip.exe }
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host ' YOUR SHARE LINK (already copied - just paste it to the person):' -ForegroundColor Green
    Write-Host ''
    Write-Host "   $url" -ForegroundColor Yellow
    Write-Host ''
    Write-Host ' It is also saved in share-link.txt in the project folder,' -ForegroundColor Green
    Write-Host ' and opening in your browser now so you can see what they see.' -ForegroundColor Green
    Write-Host ''
    Write-Host ' KEEP THIS WINDOW OPEN while sharing. Close it to stop.' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Green
    Start-Process $url
    Wait-Process -Id $tunnel.Id
} else {
    Write-Host ''
    Write-Host 'SHARING FAILED: Cloudflare could not create the link.' -ForegroundColor Red
    Write-Host 'This is usually the internet connection or the antivirus blocking cloudflared.exe.' -ForegroundColor Red
    Write-Host 'Details from the tool:' -ForegroundColor Red
    foreach ($log in $errLog, $outLog) { if (Test-Path $log) { Get-Content $log -Tail 12 } }
    if (-not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force }
    exit 1
}
