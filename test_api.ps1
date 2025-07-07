# 测试SmartEdu API端点

$baseUrl = "http://localhost:8080/api"

Write-Host "=== SmartEdu API测试 ===" -ForegroundColor Green
Write-Host ""

# 测试1: 检查应用状态
Write-Host "1. 测试应用状态..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/check" -Method GET
    Write-Host "✓ 应用状态正常" -ForegroundColor Green
    Write-Host "响应: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 应用状态检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试2: 测试教师注册
Write-Host "2. 测试教师注册..." -ForegroundColor Yellow
$teacherData = @{
    username = "test_teacher_$(Get-Date -Format 'yyyyMMddHHmmss')"
    password = "test123"
    realName = "测试教师"
    email = "teacher@test.com"
    teacherCode = "T$(Get-Date -Format 'yyyyMMddHHmmss')"
    department = "计算机学院"
    title = "讲师"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/teacher" -Method POST -Body $teacherData -ContentType "application/json"
    Write-Host "✓ 教师注册成功" -ForegroundColor Green
    Write-Host "响应: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 教师注册失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""

# 测试3: 测试学生注册
Write-Host "3. 测试学生注册..." -ForegroundColor Yellow
$studentData = @{
    username = "test_student_$(Get-Date -Format 'yyyyMMddHHmmss')"
    password = "test123"
    realName = "测试学生"
    email = "student@test.com"
    studentId = "S$(Get-Date -Format 'yyyyMMddHHmmss')"
    className = "测试班级"
    major = "计算机科学"
    grade = "2024级"
    entranceYear = 2024
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/student" -Method POST -Body $studentData -ContentType "application/json"
    Write-Host "✓ 学生注册成功" -ForegroundColor Green
    Write-Host "响应: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 学生注册失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Green 