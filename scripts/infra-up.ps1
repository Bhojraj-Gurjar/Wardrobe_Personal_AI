# Stop app containers and start infra only (postgres, redis, qdrant)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Stopping legacy Docker app containers if present..."
docker compose stop frontend backend ai-service 2>$null | Out-Null
docker compose rm -f frontend backend ai-service 2>$null | Out-Null

Write-Host "Starting infrastructure (postgres, redis, qdrant)..."
docker compose up -d --no-build postgres redis qdrant

Write-Host ""
Write-Host "Hybrid mode (Docker apps + local AI): npm run docker:local-ai" -ForegroundColor Cyan
Write-Host ""
docker compose ps
