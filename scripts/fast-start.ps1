# Fast start: infra in Docker (no app image builds) + local Node/Python dev servers.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== Wardrobe AI — fast local start ===" -ForegroundColor Cyan

$dockerReady = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
  try {
    docker info *> $null
    $dockerReady = $true
    break
  } catch {
    if ($attempt -eq 1) {
      Write-Host "Docker not ready — starting Docker Desktop..." -ForegroundColor Yellow
      $dockerDesktop = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
      if (Test-Path $dockerDesktop) {
        Start-Process $dockerDesktop | Out-Null
      }
    }
    Write-Host "Waiting for Docker ($attempt/3)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
  }
}

if (-not $dockerReady) {
  Write-Error "Docker Desktop is not running. Open Docker Desktop manually, wait until it is ready, then run: npm run dev"
}

& "$Root\scripts\infra-up.ps1"
& "$Root\scripts\dev-local.ps1"
