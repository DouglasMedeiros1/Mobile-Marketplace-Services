# 🚀 Quick Service Testing Guide

## Overview
This guide helps you test the complete Quick Service flow with a test prestador that can automatically accept requests.

## Prerequisites
1. Backend server running
2. Database with at least one prestador user (ID: 5)
3. Mobile app connected to backend
4. WebSocket connection active

---

## Test Setup

### 1. Prepare Test Prestador (Backend Database)

Run this SQL to enable the test prestador for quick services:

```sql
-- Enable quick service availability for test prestador
UPDATE users 
SET disponivel_servico_rapido = true 
WHERE id = 5;
```

**Test Prestador Details:**
- **ID:** 5
- **Name:** João Técnico
- **Email:** joao@example.com
- **Role:** prestador

---

## Testing Steps

### A. Prestador Side (Manual Testing)

1. **Login as Prestador**
   - Email: `joao@example.com`
   - Password: (use the password set in database)

2. **Navigate to Quick Service**
   - Go to "Rápido" tab (lightning icon)
   - Click "Gerenciar Disponibilidade"

3. **Configure Availability**
   - **Location:** `-23.550520, -46.633308` (São Paulo center)
   - **Categories:** Select at least one (e.g., "Encanamento", "Elétrica")
   - **Auto-Accept Toggle:** Enable (for automatic testing) 🤖
   - Click "Salvar Disponibilidade"

4. **Verify Status**
   - Toggle should show "Disponível para atendimento" (green)
   - WebSocket status should show "Conectado" (green)

5. **Wait for Requests**
   - Leave app open
   - When auto-accept is ON: Requests are accepted automatically
   - When auto-accept is OFF: You'll see request cards with Accept/Decline buttons

---

### B. Cliente Side (Requesting Service)

1. **Login as Cliente**
   - Use any cliente account or create a new one
   - Register with role "Cliente"

2. **Navigate to Quick Service**
   - Go to "Rápido" tab
   - Click "Solicitar Serviço Rápido"

3. **Fill Request Form**
   - **Location:** `-23.550520, -46.633308` (same area as prestador)
   - **Category:** Select same category as prestador configured
   - **Description:** "Teste de serviço rápido" (optional)
   - Click "Buscar Prestador Agora"

4. **Wait for Match**
   - Loading screen appears: "🔍 Procurando prestadores..."
   - If prestador has auto-accept ON: Match happens instantly
   - If prestador has auto-accept OFF: Wait for manual acceptance

5. **Success!**
   - Modal appears: "🎉 Prestador Encontrado!"
   - Shows: "João Técnico aceitou sua solicitação"
   - Buttons: "Chat" and "Ver Serviço"

6. **View Service**
   - Click "Ver Serviço" button
   - Navigate to ServiceDetailScreen
   - Verify service has `quick: true` flag
   - Status should be appropriate

---

## Expected Behavior

### Successful Match Flow

```
Cliente                          Backend                      Prestador
   |                                |                              |
   |--POST /quick-service/request-->|                              |
   |                                |                              |
   |                                |--WS: quick_service_request-->|
   |                                |                              |
   |                                |<--WS: quick_service_response-| (accept)
   |                                |                              |
   |<--WS: quick_service_matched----|                              |
   |                                |                              |
   |                                |--WS: quick_service_started-->|
   |                                |                              |
   |     [Service Created]          |                              |
   |     [Proposal Created]         |                              |
```

### No Prestadores Available

```
Cliente                          Backend
   |                                |
   |--POST /quick-service/request-->|
   |                                |
   |<--404 No prestadores-----------|
   |                                |
   |  [Error Alert Shown]           |
```

---

## Testing Scenarios

### ✅ Scenario 1: Successful Match (Auto-Accept ON)
1. Prestador sets availability with auto-accept ON
2. Cliente requests service in same location/category
3. **Expected:** Instant match, service created automatically

### ✅ Scenario 2: Manual Accept (Auto-Accept OFF)
1. Prestador sets availability with auto-accept OFF
2. Cliente requests service
3. **Expected:** Prestador sees request card, clicks "Aceitar"
4. **Expected:** Service created, both notified

### ✅ Scenario 3: Manual Decline
1. Prestador sets availability with auto-accept OFF
2. Cliente requests service
3. Prestador clicks "Recusar"
4. **Expected:** Request removed, cliente sees "Sem Prestadores"

### ✅ Scenario 4: No Prestadores Available
1. No prestadores have availability enabled
2. Cliente requests service
3. **Expected:** Alert "Nenhum prestador disponível na sua região"

### ✅ Scenario 5: Location Expiration
1. Prestador sets availability
2. Wait 6+ minutes (coordinates expire)
3. Cliente requests service
4. **Expected:** No match (coordinates expired)
5. Prestador sees location refresh every 3 minutes when available

### ✅ Scenario 6: Category Mismatch
1. Prestador sets availability for "Encanamento"
2. Cliente requests service for "Elétrica"
3. **Expected:** No match

### ✅ Scenario 7: WebSocket Disconnection
1. Prestador sets availability
2. Disconnect WiFi/data
3. **Expected:** Status shows "Desconectado" (red)
4. Reconnect network
5. **Expected:** Auto-reconnects, status shows "Conectado" (green)

---

## Debugging

### Check WebSocket Connection

**In Prestador Screen:**
- Look for green "Conectado" badge at top
- If red "Desconectado", check network and backend

**In Cliente Screen:**
- Look for green "Conectado" badge at top

### Check Backend Logs

Look for:
```
📩 Quick service request received
✅ Match found: prestador X for cliente Y
🔔 Sending WebSocket notification to prestador
✅ Prestador accepted request
📝 Creating service for quick match
```

### Check Mobile Logs

**React Native Debugger Console:**

Prestador side:
```
📩 Received quick service request: {requestId, clienteNome, ...}
✅ Accepting request: <requestId>
```

Cliente side:
```
Quick service response: {success: true, serviceId: X, ...}
✅ Service matched: {serviceId, prestadorNome, ...}
```

### Common Issues

**1. "Nenhum prestador disponível"**
- Check prestador has `disponivel_servico_rapido = true` in database
- Verify prestador selected correct categories
- Check locations are within range (backend may have distance limit)
- Ensure coordinates haven't expired (5 min TTL)

**2. "WebSocket Desconectado"**
- Check backend WebSocket server is running
- Verify `WS_BASE_URL` in `.env` is correct
- Check JWT token is valid
- Try logout/login to refresh connection

**3. Request never arrives at prestador**
- Check WebSocket connection status on both sides
- Verify backend is sending notifications
- Check console for WebSocket errors

**4. Service not created after match**
- Check backend logs for errors
- Verify database permissions
- Check service creation endpoint

---

## Manual Database Checks

### Check Prestador Availability
```sql
SELECT id, nome, disponivel_servico_rapido, updated_at 
FROM users 
WHERE id = 5;
```

### Check Created Services
```sql
SELECT id, nome, quick, status, user_id, created_at 
FROM services 
WHERE quick = true 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Proposals
```sql
SELECT p.id, p.service_id, p.user_id, p.valor, p.status, p.created_at 
FROM proposals p 
JOIN services s ON p.service_id = s.id 
WHERE s.quick = true 
ORDER BY p.created_at DESC 
LIMIT 5;
```

### Reset Test Prestador
```sql
-- Disable availability
UPDATE users 
SET disponivel_servico_rapido = false 
WHERE id = 5;

-- Or re-enable
UPDATE users 
SET disponivel_servico_rapido = true 
WHERE id = 5;
```

---

## Success Criteria

✅ **All features working:**
- [ ] Prestador can toggle availability ON/OFF
- [ ] Prestador can set location and categories
- [ ] Prestador receives WebSocket notifications for requests
- [ ] Prestador can accept/decline requests manually
- [ ] Prestador auto-accepts when toggle is ON
- [ ] Cliente can request quick service
- [ ] Cliente sees loading state while searching
- [ ] Cliente receives match notification via WebSocket
- [ ] Service is auto-created with `quick: true`
- [ ] Proposal is auto-created and linked
- [ ] Navigation to service detail works
- [ ] WebSocket auto-reconnects on disconnect
- [ ] Location refreshes every 3 minutes

---

## Next Steps After Testing

1. **Implement GPS Location** (replace manual input)
2. **Add Push Notifications** (for background alerts)
3. **Add Distance Calculation UI** (show radius on map)
4. **Implement Chat Integration** (link "Chat" button)
5. **Add Service History** (past quick services)
6. **Add Rating/Feedback** (after service completion)

---

## Test Accounts

### Prestador (Test)
- **ID:** 5
- **Email:** joao@example.com
- **Role:** prestador

### Cliente (Create your own)
- Register via app with role "Cliente"
- Any valid email/password

---

**Ready to test! 🚀**

Follow the steps above and verify each scenario works as expected.
