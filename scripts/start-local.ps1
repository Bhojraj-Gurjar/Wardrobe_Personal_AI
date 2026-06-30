# Wardrobe AI — local dev (no app Docker images). Needs Docker only for postgres/redis/qdrant.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== Wardrobe AI local start ===" -ForegroundColor Cyan

function Test-DockerEngine {
  try {
    docker compose ps 2>&1 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-DockerEngine)) {
  Write-Host "Starting Docker Desktop (required for database)..." -ForegroundColor Yellow
  $dockerDesktop = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Start-Process $dockerDesktop | Out-Null
  }
  $ready = $false
  for ($i = 1; $i -le 36; $i++) {
    if (Test-DockerEngine) {
      $ready = $true
      break
    }
    Write-Host "  Waiting for Docker engine ($i/36)..."
    Start-Sleep -Seconds 5
  }
  if (-not $ready) {
    Write-Host ""
    Write-Host "Docker is not available. Start Docker Desktop manually, then run:" -ForegroundColor Red
    Write-Host "  npm run infra:up" -ForegroundColor Yellow
    Write-Host "  npm run dev:apps" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continuing with app servers only (login/AI will fail without infra)." -ForegroundColor Yellow
  }
}

if (Test-DockerEngine) {
  Write-Host "Starting infrastructure (postgres, redis, qdrant)..."
  docker compose up -d --no-build postgres redis qdrant
  Start-Sleep -Seconds 5

  Write-Host "Syncing database schema and seeding catalog..."
  Push-Location "$Root\backend"
  npm run prisma:db:push --silent 2>$null
  npm run seed:products --silent 2>$null
  Pop-Location
}

if (-not (Test-Path "$Root\backend\node_modules\@swc\cli")) {
  Write-Host "Installing backend dependencies..."
  Push-Location "$Root\backend"
  npm install --legacy-peer-deps
  npm run prisma:generate
  Pop-Location
}

if (-not (Test-Path "$Root\ai-service\.venv\Scripts\python.exe")) {
  Write-Error "AI venv missing. Run: cd ai-service; python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt"
}

& "$Root\scripts\dev-local.ps1"
