# Start Creerlio Backend Server
Write-Host "Starting Creerlio Backend Server..." -ForegroundColor Green
Set-Location $PSScriptRoot
& .\venv\Scripts\Activate.ps1
python main.py

