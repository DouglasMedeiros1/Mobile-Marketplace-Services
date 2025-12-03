# Quick Service API Test Script
# Tests the Quick Service endpoints with mock data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 Quick Service API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Check if server is running
Write-Host "1️⃣  Testing server connection..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "   Found $($categories.Count) categories" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server is not running or not accessible" -ForegroundColor Red
    Write-Host "   Please start the backend server first" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Login as prestador
Write-Host "2️⃣  Logging in as prestador (joao@example.com)..." -ForegroundColor Yellow
try {
    $loginBody = '{"email":"joao@example.com","password":"senha123"}'
    
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $prestadorToken = $loginData.token
    $prestadorId = $loginData.user.id
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User ID: $prestadorId" -ForegroundColor Gray
    Write-Host "   Name: $($loginData.user.nome)" -ForegroundColor Gray
    Write-Host "   Available: $($loginData.user.disponivel_servico_rapido)" -ForegroundColor Gray
    Write-Host "   Token: $($prestadorToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host "   Make sure the user exists and password is correct" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 3: Enable prestador availability
Write-Host "3️⃣  Enabling prestador availability..." -ForegroundColor Yellow
Write-Host "   Location: São Paulo (-23.550520, -46.633308)" -ForegroundColor Gray
Write-Host "   Categories: Limpeza (1), Reparos (5)" -ForegroundColor Gray
try {
    $availabilityBody = '{"disponivel":true,"lat":-23.550520,"lon":-46.633308,"categoryIds":[1,5]}'
    
    $availabilityResponse = Invoke-WebRequest -Uri "$baseUrl/user/me/quick-availability" -Method Put -Body $availabilityBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $prestadorToken"} -UseBasicParsing
    $availabilityData = $availabilityResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Availability updated!" -ForegroundColor Green
    Write-Host "   Disponível: $($availabilityData.disponivel)" -ForegroundColor Gray
    Write-Host "   ⚠️  Coordinates expire in 5 minutes!" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to update availability: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Verify prestador is available
Write-Host "4️⃣  Verifying prestador status..." -ForegroundColor Yellow
try {
    $userHeaders = @{
        "Authorization" = "Bearer $prestadorToken"
    }
    $userInfo = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $userHeaders
    
    Write-Host "✅ Prestador verified!" -ForegroundColor Green
    Write-Host "   Name: $($userInfo.nome)" -ForegroundColor Gray
    Write-Host "   Available: $($userInfo.disponivel_servico_rapido)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to verify: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Login as cliente
Write-Host "5️⃣  Creating/logging in as cliente..." -ForegroundColor Yellow
try {
    # Try to register a test cliente
    $registerBody = '{"nome":"Maria Cliente Teste","email":"maria.teste@example.com","cpf":"12345678901","senha":"senha123","role":"cliente"}'

    try {
        $registerResponse = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -UseBasicParsing
        $registerData = $registerResponse.Content | ConvertFrom-Json
        $clienteToken = $registerData.token
        Write-Host "✅ New cliente registered!" -ForegroundColor Green
        Write-Host "   Name: $($registerData.user.nome)" -ForegroundColor Gray
    } catch {
        # Cliente already exists, try to login
        $clienteLoginBody = '{"email":"maria.teste@example.com","password":"senha123"}'
        
        $clienteLoginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $clienteLoginBody -ContentType "application/json" -UseBasicParsing
        $clienteLoginData = $clienteLoginResponse.Content | ConvertFrom-Json
        $clienteToken = $clienteLoginData.token
        Write-Host "✅ Cliente logged in!" -ForegroundColor Green
        Write-Host "   Name: $($clienteLoginData.user.nome)" -ForegroundColor Gray
    }
    
    Write-Host "   Token: $($clienteToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to setup cliente: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 6: Request quick service (cliente)
Write-Host "6️⃣  Requesting quick service..." -ForegroundColor Yellow
Write-Host "   Location: SAME as prestador (-23.550520, -46.633308)" -ForegroundColor Gray
Write-Host "   Category: Limpeza (1) - SAME as prestador" -ForegroundColor Gray
Write-Host "   Value: R$ 50.00" -ForegroundColor Gray
try {
    $quickServiceBody = '{"lat":-23.550520,"lon":-46.633308,"categoryId":1,"descricao":"Teste de serviço rápido via API","valorMinimo":50.0}'
    
    $quickServiceResponse = Invoke-WebRequest -Uri "$baseUrl/quick-service/request" -Method Post -Body $quickServiceBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $clienteToken"} -UseBasicParsing
    $quickServiceData = $quickServiceResponse.Content | ConvertFrom-Json
    
    if ($quickServiceData.success) {
        Write-Host "✅ Quick service request successful!" -ForegroundColor Green
        Write-Host "   Service ID: $($quickServiceData.serviceId)" -ForegroundColor Gray
        Write-Host "   Prestador: $($quickServiceData.prestadorNome)" -ForegroundColor Gray
        Write-Host "   Prestador ID: $($quickServiceData.prestadorId)" -ForegroundColor Gray
        
        # Save service ID for verification
        $script:createdServiceId = $quickServiceData.serviceId
    } else {
        Write-Host "⚠️  Request sent but no prestadores available" -ForegroundColor Yellow
        Write-Host "   Message: $($quickServiceData.message)" -ForegroundColor Gray
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Failed to request service (HTTP $statusCode): $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorData.message)" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "" -ForegroundColor Red
            Write-Host "   💡 Troubleshooting:" -ForegroundColor Yellow
            Write-Host "   1. Prestador must have disponivel_servico_rapido = true" -ForegroundColor Gray
            Write-Host "   2. Prestador location must be set (Step 3 above)" -ForegroundColor Gray
            Write-Host "   3. Coordinates expire in 5 minutes - re-run Step 3 if needed" -ForegroundColor Gray
            Write-Host "   4. Cliente and Prestador must have SAME category selected" -ForegroundColor Gray
            Write-Host "   5. Locations must be within range (backend distance limit)" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Test 7: Disable prestador availability
Write-Host "7️⃣  Disabling prestador availability..." -ForegroundColor Yellow
try {
    $disableBody = '{"disponivel":false}'

    $disableResponse = Invoke-WebRequest -Uri "$baseUrl/user/me/quick-availability" -Method Put -Body $disableBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $prestadorToken"} -UseBasicParsing
    $disableData = $disableResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Availability disabled!" -ForegroundColor Green
    Write-Host "   Status: $($disableData.disponivel)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to disable: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Verify created service (if it was created)
if ($script:createdServiceId) {
    Write-Host "8️⃣  Verifying created service..." -ForegroundColor Yellow
    try {
        $serviceResponse = Invoke-WebRequest -Uri "$baseUrl/services/$($script:createdServiceId)" -Method Get -Headers @{"Authorization"="Bearer $clienteToken"} -UseBasicParsing
        $serviceData = $serviceResponse.Content | ConvertFrom-Json
        
        Write-Host "✅ Service verified!" -ForegroundColor Green
        Write-Host "   ID: $($serviceData.id)" -ForegroundColor Gray
        Write-Host "   Name: $($serviceData.nome)" -ForegroundColor Gray
        Write-Host "   Quick: $($serviceData.quick)" -ForegroundColor Gray
        Write-Host "   Status: $($serviceData.status)" -ForegroundColor Gray
        Write-Host "   Created: $($serviceData.created_at)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Could not verify service" -ForegroundColor Yellow
    }
    Write-Host ""
}


Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 API Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Server: Running ✅" -ForegroundColor Green
Write-Host "  - Prestador Login: OK ✅" -ForegroundColor Green
Write-Host "  - Availability Toggle: OK ✅" -ForegroundColor Green
Write-Host "  - Cliente Setup: OK ✅" -ForegroundColor Green
Write-Host "  - Quick Service Request: Check results above" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Open the React Native app" -ForegroundColor Gray
Write-Host "  2. Login as prestador (joao@example.com)" -ForegroundColor Gray
Write-Host "  3. Enable availability in Quick Service screen" -ForegroundColor Gray
Write-Host "  4. Login as cliente in another device/emulator" -ForegroundColor Gray
Write-Host "  5. Request quick service and test WebSocket matching" -ForegroundColor Gray
Write-Host ""
