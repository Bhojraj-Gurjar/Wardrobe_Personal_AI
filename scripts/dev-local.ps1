# Start frontend, backend, and AI service locally (infra must be running)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

function Stop-PortListener {
  param([int]$Port)
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "Freeing ports 3000, 3001, 8000..."
foreach ($port in @(3000, 3001, 8000)) {
  Stop-PortListener -Port $port
}

if (-not (Test-Path "$Root\backend\uploads")) {
  New-Item -ItemType Directory -Path "$Root\backend\uploads" | Out-Null
}

Write-Host "Starting backend on http://localhost:3000 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$Root\backend'; npm run start:dev"
)

Start-Sleep -Seconds 4

Write-Host "Starting AI service on http://localhost:8000 ..."
$aiPython = "$Root\ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $aiPython)) {
  Write-Host "AI venv not found. Run: cd ai-service; python -m venv .venv; .\.venv\Scripts\activate; pip install torch --index-url https://download.pytorch.org/whl/cpu; pip install -r requirements.txt"
  exit 1
}
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$Root\ai-service'; & '$aiPython' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://localhost:3001 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$Root\frontend'; npm run dev:3001"
)

Write-Host ""
Write-Host "Local dev servers starting in separate windows:"
Write-Host "  Frontend   http://localhost:3001"
Write-Host "  Backend    http://localhost:3000/api/v1/health"
Write-Host "  AI         http://localhost:8000/health"
