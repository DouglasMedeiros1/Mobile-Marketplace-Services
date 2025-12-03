# Test Notification Preferences API
# PowerShell script to test the new endpoints

$baseUrl = "http://localhost:3000"
$token = "" # Add your JWT token here after login

# Headers
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "=== Testing Notification Preferences API ===" -ForegroundColor Cyan

# Test 1: Get preferences (should return defaults if not set)
Write-Host "`n1. GET /notification-preferences" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/notification-preferences" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 3
    Write-Host "✓ GET successful" -ForegroundColor Green
} catch {
    Write-Host "✗ GET failed: $_" -ForegroundColor Red
}

# Test 2: Update preferences
Write-Host "`n2. PUT /notification-preferences" -ForegroundColor Yellow
$updateData = @{
    report_enabled = $true
    report_frequency = "weekly"
    report_day_of_week = 1
    report_time = "09:00:00"
    notification_method = "in-app"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/notification-preferences" -Method PUT -Headers $headers -Body $updateData
    $response | ConvertTo-Json -Depth 3
    Write-Host "✓ PUT successful" -ForegroundColor Green
} catch {
    Write-Host "✗ PUT failed: $_" -ForegroundColor Red
}

# Test 3: Get preferences again (should show updated values)
Write-Host "`n3. GET /notification-preferences (after update)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/notification-preferences" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 3
    Write-Host "✓ GET successful" -ForegroundColor Green
} catch {
    Write-Host "✗ GET failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nNote: Make sure to:" -ForegroundColor Yellow
Write-Host "1. Start the backend server (npm start)" -ForegroundColor White
Write-Host "2. Login and copy your JWT token" -ForegroundColor White
Write-Host "3. Update the `$token variable at the top of this script" -ForegroundColor White
