# Serviços Rápidos - Documentação de Implementação

## Visão Geral

Sistema de **Serviços Rápidos** implementado no Mobile Marketplace Services, funcionando como uma variação dos serviços convencionais seguindo o modelo de aplicativos de transporte (Uber): cliente solicita serviço com sua localização atual, sistema notifica prestadores disponíveis próximos em ordem de distância (um por vez), primeiro que aceitar é automaticamente vinculado ao serviço.

## Características Principais

- ✅ **Sem armazenamento permanente de coordenadas**: Dados de geolocalização são mantidos apenas em arquivos JSON temporários com TTL
- ✅ **Notificações em tempo real**: Via WebSocket para baixa latência
- ✅ **Matching automático**: Primeiro prestador que aceita é automaticamente vinculado (service + proposal + record criados atomicamente)
- ✅ **Reserva atômica**: Sistema de claims previne aceitações duplicadas
- ✅ **Cleanup automático**: Timer remove dados expirados a cada 60 segundos

## Alterações no Banco de Dados

### Tabela `users`
```sql
ALTER TABLE users ADD COLUMN disponivel_servico_rapido BOOLEAN DEFAULT FALSE;
```
- Indica se o prestador está disponível para receber solicitações de serviço rápido

### Tabela `services`
```sql
ALTER TABLE services ADD COLUMN quick BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_services_quick ON services(quick) WHERE quick = TRUE;
```
- Identifica serviços criados via fluxo de serviço rápido
- Serviços rápidos podem ter `data_inicio`, `data_fim`, `local` NULL
- `valor_minimo` = `valor_maximo` (preço fixo)

## Arquitetura de Arquivos JSON

### Estrutura de Diretórios
```
Backend/Server/data_QuickService/
├── available_prestadores.json    (prestadores disponíveis com coords)
├── active_claims.json             (reservas temporárias)
└── pending_requests.json          (requests aguardando resposta)
```

### available_prestadores.json
Armazena prestadores disponíveis com suas localizações (TTL 5 minutos):
```json
[
  {
    "userId": 10,
    "nome": "Carlos Silva",
    "lat": -23.550520,
    "lon": -46.633308,
    "categoryIds": [1, 2],
    "updatedAt": "2025-11-27T10:25:00.000Z",
    "expiresAt": "2025-11-27T10:30:00.000Z"
  }
]
```

### active_claims.json
Gerencia reservas de prestadores (TTL 30 segundos):
```json
{
  "prestador_10": {
    "requestId": "abc-123-uuid",
    "claimedAt": "2025-11-27T10:26:00.000Z",
    "expiresAt": "2025-11-27T10:26:30.000Z"
  }
}
```

### pending_requests.json
Rastreia solicitações em andamento (TTL 5 minutos):
```json
{
  "request_uuid-123": {
    "clienteId": 456,
    "lat": -23.5505,
    "lon": -46.6333,
    "categoryId": 1,
    "descricao": "Preciso de reparo urgente",
    "valorMinimo": 150.00,
    "createdAt": "2025-11-27T10:25:00.000Z",
    "expiresAt": "2025-11-27T10:30:00.000Z"
  }
}
```

## Endpoints da API

### 1. PUT `/user/me/quick-availability`
**Ativa/desativa disponibilidade do prestador para serviços rápidos**

**Autenticação:** Token JWT (role: `prestador`)

**Request Body:**
```json
{
  "disponivel": true,
  "lat": -23.550520,
  "lon": -46.633308,
  "categoryIds": [1, 2]
}
```

**Response:**
```json
{
  "success": true,
  "disponivel": true
}
```

**Validações:**
- Apenas prestadores podem ativar
- Se `disponivel=true`: `lat`, `lon`, `categoryIds` são obrigatórios
- Coordenadas válidas: lat (-90 a 90), lon (-180 a 180)
- CategoryIds devem existir no banco

---

### 2. POST `/quick-service/request`
**Cliente solicita serviço rápido**

**Autenticação:** Token JWT (role: `cliente`)

**Request Body:**
```json
{
  "lat": -23.550520,
  "lon": -46.633308,
  "categoryId": 1,
  "descricao": "Preciso de reparo de encanamento",
  "valorMinimo": 150.00
}
```

**Response (sucesso):**
```json
{
  "success": true,
  "serviceId": 42,
  "prestadorId": 10,
  "prestadorNome": "Carlos Silva"
}
```

**Response (nenhum prestador disponível):**
```json
{
  "success": false,
  "message": "Nenhum prestador disponível na sua região"
}
```

**Fluxo:**
1. Valida campos e permissões
2. Carrega prestadores disponíveis do JSON
3. Filtra por categoria e calcula distância (Haversine)
4. Ordena por proximidade ASC (raio máximo 5km)
5. Itera prestadores notificando via WebSocket (timeout 15s cada)
6. Primeiro que aceitar: cria service + proposal + record atomicamente
7. Notifica cliente e prestador sobre o match

---

### 3. GET `/quick-service/available-prestadores`
**Lista prestadores disponíveis (debug/admin)**

**Autenticação:** Token JWT (role: `admin`)

**Response:**
```json
[
  {
    "userId": 10,
    "nome": "Carlos Silva",
    "lat": -23.550520,
    "lon": -46.633308,
    "categoryIds": [1, 2],
    "updatedAt": "2025-11-27T10:25:00.000Z",
    "expiresAt": "2025-11-27T10:30:00.000Z"
  }
]
```

## WebSocket - Mensagens

### Mensagens para Prestador

#### quick_service_request
Notificação de solicitação de serviço:
```json
{
  "type": "quick_service_request",
  "requestId": "uuid-v4",
  "clienteId": 456,
  "clienteNome": "Maria Santos",
  "categoryId": 1,
  "categoriaNome": "Encanamento",
  "descricao": "Preciso de reparo urgente",
  "valorMinimo": 150.00,
  "distanceMeters": 1234
}
```

#### quick_service_started
Confirmação de que serviço foi criado:
```json
{
  "type": "quick_service_started",
  "serviceId": 42,
  "clienteId": 456,
  "clienteNome": "Maria Santos"
}
```

### Mensagens do Prestador

#### quick_service_response
Resposta do prestador (aceitar/recusar):
```json
{
  "type": "quick_service_response",
  "requestId": "uuid-v4",
  "action": "accept"  // ou "reject"
}
```

### Mensagens para Cliente

#### quick_service_matched
Notificação de match bem-sucedido:
```json
{
  "type": "quick_service_matched",
  "serviceId": 42,
  "prestadorId": 10,
  "prestadorNome": "Carlos Silva"
}
```

## Fluxo Completo

### Fase 1: Prestador Ativa Disponibilidade
1. App mobile chama `PUT /user/me/quick-availability`
2. Sistema atualiza `users.disponivel_servico_rapido = TRUE`
3. Adiciona prestador em `available_prestadores.json` (TTL 5min)
4. Timer de cleanup remove automaticamente após expiração

### Fase 2: Cliente Solicita Serviço
1. App mobile chama `POST /quick-service/request`
2. Sistema valida dados e gera requestId
3. Salva em `pending_requests.json`
4. Carrega prestadores disponíveis e filtra por categoria
5. Calcula distância Haversine e ordena por proximidade

### Fase 3: Notificação e Matching
1. Para cada prestador (do mais próximo):
   - Verifica se não tem claim ativo
   - Cria claim temporário (TTL 30s)
   - Envia `quick_service_request` via WebSocket
   - Aguarda resposta com timeout 15s

2. Se prestador aceitar:
   - Inicia transação DB:
     - INSERT em `services` (quick=TRUE)
     - INSERT em `proposals` (status='aceito')
     - INSERT em `record_service` (status='em andamento')
   - Se sucesso: notifica ambos, limpa claims/requests
   - Se falha: rollback, libera claim, tenta próximo

3. Se recusar ou timeout:
   - Libera claim, tenta próximo prestador

### Fase 4: Pós-Match
- Service criado com `quick = TRUE`
- Status automático: `em andamento`
- Sistema trata como serviço normal (chat, atualizações, avaliação)
- Coordenadas nunca são salvas permanentemente

## Módulos Criados/Modificados

### Novos Arquivos

#### `utils/geolocation.js`
- `haversineDistance(lat1, lon1, lat2, lon2)`: Calcula distância em metros
- `filterByProximity(prestadores, lat, lon, radius)`: Filtra e ordena por distância

#### `utils/quickServiceStorage.js`
Gerencia arquivos JSON com file locking:
- `loadAvailablePrestadores()` / `saveAvailablePrestadores()`
- `addAvailablePrestador()` / `removeAvailablePrestador()`
- `loadActiveClaims()` / `saveActiveClaims()`
- `claimPrestador()` / `releaseClaim()`
- `loadPendingRequests()` / `savePendingRequests()`
- `addPendingRequest()` / `removePendingRequest()`
- `cleanupExpired()`: Remove dados expirados

#### `routes/quickService.js`
- `POST /request`: Endpoint principal de solicitação
- `GET /available-prestadores`: Debug/admin
- `setWsManager()`: Injeta referência do WebSocket manager

### Arquivos Modificados

#### `routes/chat.js`
- Adicionado Map `quickServiceResponses` para gerenciar respostas
- Handler para mensagem tipo `quick_service_response`
- Exporta `wsManager` com funções:
  - `notifyUser(userId, payload)`
  - `sendQuickServiceRequest(userId, payload, timeout)`

#### `routes/user.js`
- Novo endpoint `PUT /me/quick-availability`
- Gerencia disponibilidade do prestador
- Atualiza JSON e campo no DB

#### `app.js`
- Registra rota `/quick-service`
- Configura timer de cleanup (60s)

#### `index.js`
- Captura retorno de `setupWebSocketServer()`
- Injeta `wsManager` no módulo `quickService`

## Dependências Adicionadas

```json
{
  "proper-lockfile": "^4.x.x",  // File locking para JSON
  "uuid": "^13.0.0"              // Geração de requestId (já existente)
}
```

Instalar com:
```bash
npm install proper-lockfile
```

## Configurações e Variáveis

### Constantes no Código
- **TTL Prestador Disponível:** 5 minutos
- **TTL Claim:** 30 segundos
- **TTL Pending Request:** 5 minutos
- **Timeout WebSocket:** 15 segundos por prestador
- **Raio Máximo:** 5000 metros (5km)
- **Intervalo de Cleanup:** 60 segundos

## Segurança e Privacidade

- ✅ Coordenadas **não são armazenadas permanentemente** no banco de dados
- ✅ Dados geográficos em JSON têm **TTL automático**
- ✅ Autenticação via **JWT** em todos os endpoints
- ✅ Validação de roles (cliente/prestador/admin)
- ✅ File locking previne race conditions
- ⚠️ **Nota:** Não logar coordenadas em console/logs de produção

## Limitações Conhecidas

1. **Single-instance:** Arquivos JSON não escalam para múltiplos servidores (usar Redis em produção)
2. **Concorrência:** Possível race condition rara em requests simultâneas
3. **Offline:** Prestadores desconectados do WebSocket não recebem notificações (implementar push futuramente)
4. **Timeout acumulado:** Se muitos prestadores recusarem, cliente espera muito tempo (15s × N prestadores)

## Testes Recomendados

### Fluxo Básico
1. ✅ Prestador ativa disponibilidade → verifica JSON atualizado
2. ✅ Cliente solicita serviço → verifica notificação WS ao prestador
3. ✅ Prestador aceita → verifica criação no DB (service + proposal + record)
4. ✅ Verifica que coords não estão no DB permanente

### Casos de Erro
1. ✅ Prestador recusa → sistema tenta próximo
2. ✅ Timeout de resposta → sistema tenta próximo
3. ✅ Falha na transação DB → rollback e continua
4. ✅ Nenhum prestador disponível → retorna 404

### Expiração e Cleanup
1. ✅ Prestador expira após 5min → removido automaticamente
2. ✅ Claim expira após 30s → liberado automaticamente
3. ✅ Timer de cleanup executa a cada 60s

## Comandos Úteis

### Iniciar Servidor
```bash
cd Backend/Server
npm start
```

### Testar Endpoints
```bash
# Ativar disponibilidade (prestador)
curl -X PUT http://localhost:3000/user/me/quick-availability \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "disponivel": true,
    "lat": -23.5505,
    "lon": -46.6333,
    "categoryIds": [1, 2]
  }'

# Solicitar serviço rápido (cliente)
curl -X POST http://localhost:3000/quick-service/request \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -23.5515,
    "lon": -46.6343,
    "categoryId": 1,
    "descricao": "Preciso de ajuda urgente",
    "valorMinimo": 100.00
  }'
```

## Próximos Passos (Futuro)

- [ ] Migrar de JSON para Redis (produção/cluster)
- [ ] Implementar push notifications (FCM/APNs) para prestadores offline
- [ ] Notificação paralela aos primeiros 3 prestadores (reduzir tempo de espera)
- [ ] Histórico de serviços rápidos para analytics
- [ ] Rate limiting por usuário (prevenir spam)
- [ ] Constraint UNIQUE em `record_service` para detectar duplicatas
- [ ] Métricas: tempo médio de matching, taxa de aceitação, etc.

---

**Status:** ✅ Implementação completa e funcional
**Data:** 27 de Novembro de 2025
**Versão:** 1.0.0
