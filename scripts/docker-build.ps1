# Build Wardrobe AI images one at a time to avoid Docker Desktop OOM / EOF crashes.
# Usage: .\scripts\docker-build.ps1 [-Up]

param(
    [switch]$Up
)

$ErrorActionPreference = "Stop"
$env:COMPOSE_PARALLEL_LIMIT = "1"
$env:DOCKER_BUILDKIT = "1"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Build-Service {
    param([string]$Name)
    Write-Host "`n=== Building $Name ===" -ForegroundColor Cyan
    docker compose build $Name
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed for $Name"
    }
}

try {
    docker info *> $null
} catch {
    Write-Error "Docker Desktop is not running. Start Docker Desktop, wait until it is ready, then rerun this script."
}

# Heaviest image first while Docker has the most free memory.
Build-Service "ai-service"
Build-Service "backend"
Build-Service "frontend"

if ($Up) {
    Write-Host "`n=== Starting stack ===" -ForegroundColor Cyan
    docker compose up -d
}

Write-Host "`nAll images built successfully." -ForegroundColor Green
