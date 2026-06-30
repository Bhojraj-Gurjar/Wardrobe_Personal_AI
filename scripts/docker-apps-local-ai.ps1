# Docker: postgres + redis + qdrant + backend + frontend
# Local:  ai-service (avoids large AI Docker image/volumes)
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$ComposeFiles = @(
    "-f", "docker-compose.yml",
    "-f", "docker-compose.local-ai.yml"
)

function Test-DockerEngine {
    try {
        docker info *> $null
        return $true
    } catch {
        return $false
    }
}

function Stop-PortListener {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Ensure-UploadDirs {
    param([string]$UploadsRoot)
    foreach ($folder in @("avatars", "body", "faces", "user-png", "try-on", "products")) {
        $path = Join-Path $UploadsRoot $folder
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
}

function Wait-HttpOk {
    param(
        [string]$Url,
        [int]$Attempts = 30,
        [int]$DelaySeconds = 2
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                return $true
            }
        } catch {
            Write-Host "  Waiting for $Url ($i/$Attempts)..."
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    return $false
}

Write-Host '=== Wardrobe AI - Docker apps + local AI ===' -ForegroundColor Cyan

if (-not (Test-DockerEngine)) {
    Write-Error "Docker Desktop is not running. Start Docker Desktop, then rerun: npm run docker:local-ai"
}

Write-Host "Stopping Docker ai-service container (if present)..."
$previousErrorAction = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
docker compose @ComposeFiles stop ai-service | Out-Null
docker compose @ComposeFiles rm -f ai-service | Out-Null
$ErrorActionPreference = $previousErrorAction

Write-Host "Freeing ports 3000, 3001, 8000 for hybrid stack..."
foreach ($port in @(3000, 3001, 8000)) {
    Stop-PortListener -Port $port
}

$uploadsRoot = Join-Path $Root "backend\uploads"
Ensure-UploadDirs -UploadsRoot $uploadsRoot

Write-Host "Starting Docker stack (infra + backend + frontend)..."
if ($SkipBuild) {
    docker compose @ComposeFiles up -d --no-build postgres redis qdrant backend frontend
} else {
    docker compose @ComposeFiles up -d --build postgres redis qdrant backend frontend
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker compose failed. Check output above."
}

Write-Host "Waiting for backend health..."
if (-not (Wait-HttpOk -Url "http://localhost:3000/api/v1/health")) {
    Write-Warning "Backend health check timed out. Inspect logs: docker compose logs backend"
}

$aiPython = Join-Path $Root "ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $aiPython)) {
    Write-Error "AI venv missing. Run: cd ai-service; python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt"
}

Write-Host "Starting local ai-service on http://localhost:8000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$Root\scripts\start-local-ai.ps1"
)

Write-Host ""
Write-Host "Hybrid stack is starting:"
Write-Host "  Frontend   http://localhost:3001"
Write-Host "  Backend    http://localhost:3000/api/v1/health"
Write-Host "  AI (local) http://localhost:8000/health"
Write-Host ""
Write-Host 'Useful commands:'
Write-Host '  docker compose -f docker-compose.yml -f docker-compose.local-ai.yml logs -f backend'
Write-Host '  docker compose -f docker-compose.yml -f docker-compose.local-ai.yml down'
Write-Host ""
docker compose @ComposeFiles ps
