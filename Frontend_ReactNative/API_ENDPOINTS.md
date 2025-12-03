# API Endpoints Reference - React Native Frontend

Quick reference guide for all backend endpoints used in the Mobile Marketplace Services frontend.

## Base URLs

```
REST API: http://localhost:3000
WebSocket: ws://localhost:3000
```

**For Android Emulator**: Use `http://10.0.2.2:3000` and `ws://10.0.2.2:3000`

---

## 🔐 Authentication Endpoints

### POST `/auth/register`
Register new user (cliente or prestador)

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "cpf": "12345678900",
  "telefone": "11999999999",
  "role": "cliente"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678900",
    "telefone": "11999999999",
    "roles": ["cliente"],
    "disponivel_servico_rapido": false,
    "created_at": "2025-11-30T10:00:00.000Z"
  }
}
```

---

### POST `/auth/login`
Authenticate user

**Request:**
```json
{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "roles": ["cliente"]
  }
}
```

---

### POST `/auth/logout`
Blacklist JWT token

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso. O token foi invalidado."
}
```

---

### GET `/auth/me`
Get current authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@example.com",
  "cpf": "12345678900",
  "telefone": "11999999999",
  "bio": null,
  "rating": null,
  "disponivel_servico_rapido": false,
  "roles": ["cliente"],
  "created_at": "2025-11-30T10:00:00.000Z"
}
```

---

### POST `/auth/password/forgot`
Request password recovery code

**Request:**
```json
{
  "email": "joao@example.com"
}
```

**Response (200):**
```json
{
  "message": "Se o email existir, um código de recuperação foi enviado."
}
```

---

### POST `/auth/password/reset`
Reset password with recovery code

**Request:**
```json
{
  "email": "joao@example.com",
  "recovery_code": "123456",
  "new_password": "novaSenha123"
}
```

**Response (200):**
```json
{
  "message": "Senha redefinida com sucesso."
}
```

---

## 🛠️ Services Endpoints

### GET `/services`
List all services

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Reparo de Celular",
    "descricao": "Troca de tela",
    "valor_minimo": 100.00,
    "valor_maximo": 300.00,
    "data_inicio": null,
    "data_fim": "2025-12-31T23:59:59.000Z",
    "local": "São Paulo, SP",
    "user_id": 5,
    "metodo_pagamento": "pix",
    "category_id": 1,
    "status": "aberto",
    "quick": false,
    "created_at": "2025-11-30T10:00:00.000Z"
  }
]
```

---

### GET `/services/:id`
Get service by ID

**Response (200):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular",
  "descricao": "Troca de tela",
  "valor_minimo": 100.00,
  "valor_maximo": 300.00,
  "data_fim": "2025-12-31T23:59:59.000Z",
  "category_id": 1,
  "user_id": 5
}
```

---

### POST `/services`
Create new service (cliente only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "nome": "Reparo de Celular",
  "descricao": "Troca de tela",
  "valor_minimo": 100.00,
  "valor_maximo": 300.00,
  "data_fim": "2025-12-31T23:59:59.000Z",
  "local": "São Paulo, SP",
  "metodo_pagamento": "pix",
  "category_id": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular",
  "created_at": "2025-11-30T10:00:00.000Z"
}
```

---

### PUT `/services/:id`
Update service (owner or admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "nome": "Reparo de Celular - Atualizado",
  "valor_maximo": 350.00
}
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular - Atualizado",
  "updated_at": "2025-11-30T11:00:00.000Z"
}
```

---

### DELETE `/services/:id`
Delete service (owner or admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Serviço deletado com sucesso"
}
```

---

## 💼 Proposals Endpoints

### GET `/proposals/service/:serviceId`
Get all proposals for a service

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "prestador_id": 10,
    "valor": 150.00,
    "mensagem": "Posso fazer amanhã",
    "status": "aberto",
    "created_at": "2025-11-30T10:00:00.000Z"
  }
]
```

---

### GET `/proposals/my`
Get prestador's proposals

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "valor": 150.00,
    "status": "aberto"
  }
]
```

---

### POST `/proposals`
Create proposal (prestador only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "service_id": 1,
  "valor": 150.00,
  "mensagem": "Posso fazer amanhã"
}
```

**Response (201):**
```json
{
  "id": 1,
  "service_id": 1,
  "prestador_id": 10,
  "valor": 150.00,
  "status": "aberto"
}
```

---

### PATCH `/proposals/:id/status`
Update proposal status

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "aceito"
}
```

**Response (200):**
```json
{
  "id": 1,
  "status": "aceito",
  "updated_at": "2025-11-30T11:00:00.000Z"
}
```

**Valid statuses:** `aberto`, `aceito`, `recusado`, `cancelado`

---

### DELETE `/proposals/:id`
Delete proposal (prestador owner)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Proposta deletada com sucesso"
}
```

---

## 💬 Chat Endpoints (REST)

### GET `/chat/rooms`
List all conversations

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "clienteId": 5,
    "prestadorId": 10,
    "clienteNome": "Maria Silva",
    "prestadorNome": "João Técnico",
    "createdAt": "2025-11-30T10:00:00.000Z",
    "unreadCount": 2,
    "lastMessage": {
      "message": "Quando você pode vir?",
      "createdAt": "2025-11-30T10:30:00.000Z"
    }
  }
]
```

---

### GET `/chat/messages/:otherUserId`
Get message history with user (marks as read)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "clienteId": 5,
  "prestadorId": 10,
  "clienteNome": "Maria Silva",
  "prestadorNome": "João Técnico",
  "messages": [
    {
      "id": 1,
      "senderId": 5,
      "senderNome": "Maria Silva",
      "message": "Olá!",
      "isRead": true,
      "createdAt": "2025-11-30T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/chat/messages`
Send message via REST (fallback)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "otherUserId": 10,
  "message": "Olá, tudo bem?"
}
```

**Response (201):**
```json
{
  "id": 3,
  "senderId": 5,
  "senderNome": "Maria Silva",
  "message": "Olá, tudo bem?",
  "isRead": false,
  "createdAt": "2025-11-30T11:00:00.000Z"
}
```

---

## ⚡ Quick Service Endpoints

### PUT `/user/me/quick-availability`
Update prestador availability

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "disponivel": true,
  "lat": -23.550520,
  "lon": -46.633308,
  "categoryIds": [1, 2]
}
```

**Response (200):**
```json
{
  "success": true,
  "disponivel": true
}
```

---

### POST `/quick-service/request`
Request quick service (cliente)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "lat": -23.550520,
  "lon": -46.633308,
  "categoryId": 1,
  "descricao": "Preciso de reparo urgente",
  "valorMinimo": 150.00
}
```

**Response (200) - Match Found:**
```json
{
  "success": true,
  "serviceId": 42,
  "prestadorId": 10,
  "prestadorNome": "Carlos Silva"
}
```

**Response (404) - No Providers:**
```json
{
  "success": false,
  "message": "Nenhum prestador disponível na sua região"
}
```

---

## 🔌 WebSocket Messages

### Connection URL
```
ws://localhost:3000/chat?token=<jwt-token>
```

### Client → Server Messages

#### Send Chat Message
```json
{
  "type": "send_message",
  "otherUserId": 10,
  "message": "Olá, tudo bem?"
}
```

#### Mark Messages as Read
```json
{
  "type": "mark_read",
  "otherUserId": 10
}
```

#### Quick Service Response (Prestador)
```json
{
  "type": "quick_service_response",
  "requestId": "uuid-v4",
  "action": "accept"
}
```

---

### Server → Client Messages

#### Connection Established
```json
{
  "type": "connected",
  "userId": 5,
  "userName": "Maria Silva",
  "message": "Conectado ao servidor de chat com sucesso."
}
```

#### New Chat Message Received
```json
{
  "type": "new_message",
  "data": {
    "id": 4,
    "senderId": 10,
    "senderNome": "João Técnico",
    "message": "Olá!",
    "isRead": false,
    "createdAt": "2025-11-30T11:05:00.000Z"
  }
}
```

#### Message Sent Confirmation
```json
{
  "type": "message_sent",
  "data": {
    "id": 5,
    "senderId": 5,
    "senderNome": "Maria Silva",
    "message": "Tudo bem!",
    "isRead": false,
    "createdAt": "2025-11-30T11:06:00.000Z"
  }
}
```

#### Messages Marked as Read
```json
{
  "type": "marked_read",
  "otherUserId": 10
}
```

#### Quick Service Request (to Prestador)
```json
{
  "type": "quick_service_request",
  "requestId": "uuid-v4",
  "clienteId": 5,
  "clienteNome": "Maria Santos",
  "categoryId": 1,
  "categoriaNome": "Encanamento",
  "descricao": "Preciso de reparo urgente",
  "valorMinimo": 150.00,
  "distanceMeters": 1234
}
```

#### Quick Service Matched (to Cliente)
```json
{
  "type": "quick_service_matched",
  "serviceId": 42,
  "prestadorId": 10,
  "prestadorNome": "Carlos Silva"
}
```

#### Quick Service Started (to Prestador)
```json
{
  "type": "quick_service_started",
  "serviceId": 42,
  "clienteId": 5,
  "clienteNome": "Maria Santos"
}
```

#### Error
```json
{
  "type": "error",
  "message": "Descrição do erro"
}
```

---

## 🚨 Error Responses

All endpoints may return errors in this format:

### 400 Bad Request
```json
{
  "error": "Campos obrigatórios ausentes"
}
```

### 401 Unauthorized
```json
{
  "error": "Token JWT não fornecido ou inválido"
}
```

### 403 Forbidden
```json
{
  "error": "Acesso negado"
}
```

### 404 Not Found
```json
{
  "error": "Recurso não encontrado"
}
```

### 409 Conflict
```json
{
  "error": "Email já cadastrado"
}
```

### 500 Internal Server Error
```json
{
  "error": "Erro interno do servidor"
}
```

---

## 📝 Notes

- All authenticated endpoints require `Authorization: Bearer <token>` header
- Timestamps are in ISO 8601 format (UTC)
- Cliente ↔ Prestador chat validation enforced on backend
- Quick service coordinates have 5-minute TTL
- WebSocket auto-reconnects on disconnect

---

**Last Updated**: November 30, 2025
