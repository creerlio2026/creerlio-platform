# Clean restart script for backend
Write-Host "Stopping all Python processes..."
Get-Process | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Clearing Python cache..."
Get-ChildItem -Recurse -Filter "__pycache__" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Starting backend..."
if (Test-Path "venv\Scripts\python.exe") {
    Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "-B","main.py" -WorkingDirectory (Get-Location).Path -WindowStyle Normal
} else {
    Start-Process -FilePath "python" -ArgumentList "-B","main.py" -WorkingDirectory (Get-Location).Path -WindowStyle Normal
}

Write-Host "Backend started in new window. Waiting 10 seconds..."
Start-Sleep -Seconds 10

Write-Host "Checking if backend is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    Write-Host "✅ Backend is running!"
    
    Write-Host "`nChecking route registration..."
    $response = Invoke-WebRequest -Uri "http://localhost:8000/openapi.json" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    $profileMe = $json.paths.PSObject.Properties | Where-Object { $_.Name -eq "/api/business/profile/me" }
    if ($profileMe) {
        Write-Host "✅ /api/business/profile/me is registered!"
        $methods = $profileMe.Value.PSObject.Properties.Name
        Write-Host "   Methods: $($methods -join ', ')"
    } else {
        Write-Host "❌ /api/business/profile/me NOT registered"
    }
} catch {
    Write-Host "❌ Backend not responding: $($_.Exception.Message)"
}
