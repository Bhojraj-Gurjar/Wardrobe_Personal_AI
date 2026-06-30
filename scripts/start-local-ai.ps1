# Start ai-service on the host (used by docker-apps-local-ai.ps1)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Set-Location (Join-Path $Root "ai-service")

$env:UPLOADS_ROOT = Join-Path $Root "backend\uploads"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:QDRANT_URL = "http://localhost:6333"

$python = Join-Path $Root "ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "AI venv missing. Run: cd ai-service; python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt"
}

Write-Host "AI service | uploads=$($env:UPLOADS_ROOT)" -ForegroundColor Cyan
& $python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
