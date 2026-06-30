# Windows face engine install (avoids compiling dlib from source)
# Run from ai-service/: .\.venv\Scripts\pip.exe install -r requirements-base.txt
# Then: powershell -ExecutionPolicy Bypass -File scripts/install-face-windows.ps1

$pip = Join-Path $PSScriptRoot ".." ".venv" "Scripts" "pip.exe"
$python = Join-Path $PSScriptRoot ".." ".venv" "Scripts" "python.exe"

& $pip install "dlib-bin>=20.0.1" "setuptools>=75.0.0,<82" "face-recognition-models>=0.3.0"
& $pip install "face_recognition>=1.3.0" --no-deps

Write-Host "Verifying face engine..."
& $python -c "import dlib; import face_recognition; print('face engine OK')"
