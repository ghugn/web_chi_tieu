$ErrorActionPreference = "Stop"

$process = Start-Process node -ArgumentList "server.js" -PassThru -WindowStyle Hidden
Write-Host "Started node server with PID $($process.Id)"
Start-Sleep -Seconds 2

try {
  Write-Host "`n--- GET / ---"
  Invoke-RestMethod http://localhost:3000/ | ConvertTo-Json -Depth 5
  
  Write-Host "`n--- POST /auth/login (Success) ---"
  Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -Body '{"code":"123456"}' -ContentType "application/json" | ConvertTo-Json -Depth 5
  
  Write-Host "`n--- POST /expenses ---"
  Invoke-RestMethod -Uri http://localhost:3000/expenses -Method POST -Body '{"date":"2026-03-07","amount":15.5,"note":"Lunch"}' -ContentType "application/json" | ConvertTo-Json -Depth 5

  Write-Host "`n--- GET /expenses ---"
  Invoke-RestMethod http://localhost:3000/expenses | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Error during testing: $_"
} finally {
  Write-Host "`nStopping server PID $($process.Id)"
  Stop-Process -Id $process.Id -Force
}
