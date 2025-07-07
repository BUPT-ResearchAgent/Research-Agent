# Simple API test

$baseUrl = "http://localhost:8080/api"

Write-Host "Testing API endpoints..."

# Test 1: Check app status
Write-Host "1. Testing app status..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/check" -Method GET
    Write-Host "SUCCESS: App is running"
    Write-Host $response
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

# Test 2: Test teacher registration
Write-Host "2. Testing teacher registration..."
$teacherData = @{
    username = "testteacher123"
    password = "test123"
    realName = "Test Teacher"
    email = "teacher@test.com"
    teacherCode = "T123"
    department = "CS"
    title = "Lecturer"
}

try {
    $json = $teacherData | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/teacher" -Method POST -Body $json -ContentType "application/json"
    Write-Host "SUCCESS: Teacher registration successful"
    Write-Host $response
} catch {
    Write-Host "ERROR: Teacher registration failed"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response body: $errorBody"
    }
} 