# Start the full Wardrobe AI stack with Docker
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Stopping local dev servers on ports 3000, 3001, 8000..."
foreach ($port in @(3000, 3001, 8000)) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "Building and starting containers (first build may take 15-30 minutes)..."
docker compose up -d --build

Write-Host ""
Write-Host "Stack URLs:"
Write-Host "  Frontend   http://localhost:3001"
Write-Host "  Backend    http://localhost:3000/api/v1/health"
Write-Host "  FastAPI    http://localhost:8000/health"
Write-Host "  Qdrant     http://localhost:6333/collections"
Write-Host ""
docker compose ps
