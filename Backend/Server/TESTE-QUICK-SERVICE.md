# 🧪 Guia de Teste - Quick Service

## 📋 Pré-requisitos

1. Banco de dados PostgreSQL rodando
2. Tabelas criadas (`Database-MobileServices.sql`)
3. Categorias inseridas
4. Pelo menos 1 prestador e 1 cliente cadastrados

---

## 🚀 Passo 1: Executar Seed do Quick Service

```powershell
cd Server
npm run seed:quick-service
```

**O que o script faz:**
- ✅ Busca prestadores no banco
- ✅ Atualiza `disponivel_servico_rapido = true` 
- ✅ Cria `available_prestadores.json` com coordenadas de São Paulo
- ✅ Define TTL de 1 hora (para facilitar testes)
- ✅ Associa 2-4 categorias aleatórias por prestador
- ✅ Cria arquivos vazios para `active_claims.json` e `pending_requests.json`

**Resultado esperado:**
```
✅ Prestadores disponíveis cadastrados:
┌─────────┬────┬──────────────┬────────────┬──────────┬────────────┬────────────┐
│ (index) │ ID │     Nome     │   Bairro   │   Lat    │    Lon     │ Categorias │
├─────────┼────┼──────────────┼────────────┼──────────┼────────────┼────────────┤
│    0    │ 2  │ João Silva   │  Centro    │ -23.5505 │ -46.6333   │   1, 3, 5  │
│    1    │ 5  │ Maria Santos │  Paulista  │ -23.5614 │ -46.6559   │   2, 4     │
└─────────┴────┴──────────────┴────────────┴──────────┴────────────┴────────────┘
```

---

## 🔍 Passo 2: Verificar Estado Inicial

### Opção A: Via Endpoint Debug

```powershell
# Obter token de admin ou qualquer usuário
$token = "SEU_TOKEN_JWT"

# Verificar estado
curl http://localhost:3000/quick-service/debug/state `
  -H "Authorization: Bearer $token"
```

**Resposta esperada:**
```json
{
  "timestamp": "2025-12-01T12:00:00.000Z",
  "availablePrestadores": {
    "count": 2,
    "data": [
      {
        "userId": 2,
        "nome": "João Silva",
        "lat": -23.550520,
        "lon": -46.633308,
        "bairro": "Centro",
        "categoryIds": [1, 3, 5],
        "updatedAt": "2025-12-01T12:00:00.000Z",
        "expiresAt": "2025-12-01T13:00:00.000Z"
      }
    ]
  },
  "activeClaims": {
    "count": 0,
    "data": {}
  },
  "pendingRequests": {
    "count": 0,
    "data": {}
  }
}
```

### Opção B: Via Arquivo JSON

```powershell
cat Server\data_QuickService\available_prestadores.json
```

---

## 🧑‍💼 Passo 3: Fazer Login como Cliente

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"maria@example.com","senha":"senha123"}'

$clienteToken = $response.token
echo "Token Cliente: $clienteToken"
```

---

## 📱 Passo 4: Solicitar Serviço Rápido

```powershell
# Solicitar serviço próximo ao prestador do Centro
$body = @{
  lat = -23.550520
  lon = -46.633308
  categoryId = 1
  descricao = "Preciso de limpeza urgente"
  valorMinimo = 50.00
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/quick-service/request" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $clienteToken" } `
  -Body $body
```

**O que acontece nos logs do servidor:**
```
[Quick Service] Prestadores disponíveis carregados: 2
[Quick Service] Dados: [ { userId: 2, nome: 'João Silva', ... } ]
[Quick Service] Prestadores com categoria 1: 1
[Quick Service] Prestadores próximos (raio 5km): 1
[Quick Service] Dados: [ { userId: 2, distance: 0 } ]
[Quick Service] Notificando prestador 2 (João Silva) - Distância: 0m
```

---

## 🔌 Passo 5: Simular Prestador Conectado via WebSocket

### Opção A: Via Frontend Mobile
1. Login como prestador
2. Ir em "Rápido" → "Gerenciar Disponibilidade"
3. Aguardar notificação

### Opção B: Via Script Node.js

Criar arquivo `test-ws-prestador.js`:

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Token do prestador (ID 2)
const token = jwt.sign(
  { userId: 2, roles: ['prestador'] },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const ws = new WebSocket(`ws://localhost:3000/quick-service-ws?token=${token}`);

ws.on('open', () => {
  console.log('✅ Conectado ao WebSocket');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('📩 Mensagem recebida:', msg);

  if (msg.type === 'quick_service_request') {
    console.log(`\n🔔 SOLICITAÇÃO DE SERVIÇO RECEBIDA!`);
    console.log(`   Cliente: ${msg.clienteNome}`);
    console.log(`   Categoria: ${msg.categoriaNome}`);
    console.log(`   Valor: R$ ${msg.valorMinimo}`);
    console.log(`   Distância: ${msg.distanceMeters}m`);

    // Auto-aceitar após 2 segundos
    setTimeout(() => {
      console.log('\n✅ ACEITANDO SERVIÇO...');
      ws.send(JSON.stringify({
        type: 'quick_service_response',
        requestId: msg.requestId,
        action: 'accept'
      }));
    }, 2000);
  }

  if (msg.type === 'quick_service_started') {
    console.log(`\n🎉 SERVIÇO INICIADO!`);
    console.log(`   Service ID: ${msg.serviceId}`);
    console.log(`   Cliente: ${msg.clienteNome}`);
  }
});

ws.on('error', (err) => {
  console.error('❌ Erro WebSocket:', err);
});

console.log('🔄 Aguardando solicitações de serviço...\n');
```

Executar:
```powershell
node test-ws-prestador.js
```

---

## ✅ Passo 6: Verificar Resultado

### No Cliente:

**Resposta esperada do POST /quick-service/request:**
```json
{
  "success": true,
  "serviceId": 123,
  "prestadorId": 2,
  "prestadorNome": "João Silva"
}
```

**WebSocket recebe:**
```json
{
  "type": "quick_service_matched",
  "serviceId": 123,
  "prestadorId": 2,
  "prestadorNome": "João Silva"
}
```

### No Prestador:

**WebSocket recebe:**
```json
{
  "type": "quick_service_started",
  "serviceId": 123,
  "clienteId": 1,
  "clienteNome": "Maria Santos"
}
```

### No Banco de Dados:

```sql
-- Verificar serviço criado
SELECT * FROM services WHERE id = 123 AND quick = true;

-- Verificar proposta aceita
SELECT * FROM proposals WHERE service_id = 123 AND status = 'aceito';

-- Verificar registro de serviço
SELECT * FROM record_service WHERE service_id = 123 AND status = 'em andamento';
```

---

## 🧪 Casos de Teste

### ✅ Teste 1: Nenhum Prestador Disponível

```powershell
# Limpar prestadores
echo "[]" > Server\data_QuickService\available_prestadores.json

# Tentar solicitar
# Deve retornar: 404 "Nenhum prestador disponível na sua região"
```

### ✅ Teste 2: Categoria Não Atendida

```powershell
# Solicitar categoria que nenhum prestador atende
$body = @{
  lat = -23.550520
  lon = -46.633308
  categoryId = 99
  valorMinimo = 50.00
} | ConvertTo-Json

# Deve retornar: 404 "Categoria não encontrada" ou sem prestadores
```

### ✅ Teste 3: Distância Muito Grande

```powershell
# Solicitar de localização distante (> 5km)
$body = @{
  lat = -23.700000  # ~16km de distância
  lon = -46.700000
  categoryId = 1
  valorMinimo = 50.00
} | ConvertTo-Json

# Deve retornar: 404 "Nenhum prestador disponível na sua região"
```

### ✅ Teste 4: Prestador Rejeita

Modificar `test-ws-prestador.js` para enviar `action: 'reject'`:

```javascript
ws.send(JSON.stringify({
  type: 'quick_service_response',
  requestId: msg.requestId,
  action: 'reject'  // ❌ Rejeitar
}));
```

**Resultado esperado:**
- Sistema tenta próximo prestador
- Se nenhum aceitar: 404 "Nenhum prestador aceitou o serviço"

### ✅ Teste 5: Timeout de Resposta

Prestador não responde em 15 segundos:

```javascript
// NÃO enviar resposta
// Aguardar 15 segundos
```

**Resultado esperado:**
- Logs mostram timeout
- Sistema tenta próximo prestador

---

## 🐛 Debug: Problemas Comuns

### Problema 1: "404 Nenhum prestador disponível"

**Checklist:**
```powershell
# 1. Verificar se arquivo existe e tem dados
cat Server\data_QuickService\available_prestadores.json

# 2. Verificar se prestadores não expiraram (TTL)
# Se expiresAt < agora, rodar seed novamente

# 3. Verificar categoria solicitada
# Deve estar em categoryIds do prestador

# 4. Verificar distância
# Cliente e prestador devem estar a < 5km
```

### Problema 2: "Login não funciona"

**Verificar:**
- Campo deve ser `senha` ou `password` (agora aceita ambos)
- Content-Type: `application/json`
- Email existe no banco

```powershell
# Teste manual
Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"teste@example.com","senha":"senha123"}'
```

### Problema 3: "WebSocket não conecta"

**Verificar:**
```powershell
# 1. Servidor rodando
# 2. Token válido
# 3. URL correta: ws://localhost:3000/quick-service-ws?token=XXX
# 4. Role é cliente ou prestador (não admin)
```

---

## 📊 Monitoramento em Tempo Real

### Ver todos os logs do servidor:

```powershell
npm start
```

Procure por:
```
[Quick Service] Prestadores disponíveis carregados: X
[Quick Service] Notificando prestador X
✅ Prestador X ACEITOU o serviço
❌ Prestador X REJEITOU o serviço
```

### Ver estado dos arquivos JSON:

```powershell
# Prestadores
cat Server\data_QuickService\available_prestadores.json | ConvertFrom-Json | ConvertTo-Json

# Claims ativos
cat Server\data_QuickService\active_claims.json

# Requests pendentes
cat Server\data_QuickService\pending_requests.json
```

---

## 🎯 Resumo do Fluxo de Teste

```
1. npm run seed:quick-service
   ↓
2. npm start
   ↓
3. Login como cliente → obter token
   ↓
4. POST /quick-service/request (mesmas coords do prestador)
   ↓
5. Prestador conectado via WS recebe notificação
   ↓
6. Prestador envia 'accept' via WS
   ↓
7. Service + Proposal + Record criados
   ↓
8. Ambos recebem confirmação via WS
   ↓
9. ✅ SUCESSO!
```

---

## 📝 Notas Importantes

- **TTL padrão:** 1 hora (configurado no seed para facilitar testes)
- **TTL produção:** 5 minutos (configurado em `routes/user.js`)
- **Raio máximo:** 5km
- **Timeout por prestador:** 15 segundos
- **Claim duration:** 30 segundos

Para mudar TTL para 5 minutos no seed, edite `seedQuickService.mjs`:

```javascript
expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min
```
