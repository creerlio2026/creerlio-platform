$root = Get-Location

Start-Process powershell -ArgumentList "-NoExit", "-Command cd `"$root\backend`"; python -m uvicorn main:app --reload --port 8000"

Start-Process powershell -ArgumentList "-NoExit", "-Command cd `"$root\frontend`"; npm run dev"

Write-Host "Creerlio frontend and backend started safely."
