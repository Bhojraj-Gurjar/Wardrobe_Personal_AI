# Stop app containers and start infra only (postgres, redis, qdrant)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Stopping legacy Docker app containers if present..."
docker compose stop frontend backend ai-service 2>$null | Out-Null
docker compose rm -f frontend backend ai-service 2>$null | Out-Null

Write-Host "Starting infrastructure (postgres, redis, qdrant)..."
docker compose up -d --remove-orphans

Write-Host ""
docker compose ps
