# Final test with unique usernames

$baseUrl = "http://localhost:8080/api"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "=== SmartEdu Final Test ===" -ForegroundColor Green
Write-Host "Using timestamp: $timestamp" -ForegroundColor Cyan

# Test teacher registration with unique username
Write-Host "Testing teacher registration with unique username..." -ForegroundColor Yellow
$teacherData = @{
    username = "teacher_$timestamp"
    password = "abc"  # Simple 3-character password
    realName = "Test Teacher $timestamp"
    email = "teacher$timestamp@test.com"
    teacherCode = "T$timestamp"
    department = "Computer Science"
    title = "Lecturer"
}

try {
    $json = $teacherData | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/teacher" -Method POST -Body $json -ContentType "application/json"
    Write-Host "SUCCESS: Teacher registration successful!" -ForegroundColor Green
    Write-Host "Username: teacher_$timestamp" -ForegroundColor Cyan
    Write-Host "Password: abc" -ForegroundColor Cyan
    
    # Test login with the new user
    Write-Host "Testing login with new teacher..." -ForegroundColor Yellow
    $loginData = @{
        username = "teacher_$timestamp"
        password = "abc"
        role = "teacher"
    }
    $loginJson = $loginData | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginJson -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Login failed - $($loginResponse.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: Teacher registration failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test completed ===" -ForegroundColor Green
Write-Host "If you see SUCCESS messages above, the registration and login are working!" -ForegroundColor Yellow 