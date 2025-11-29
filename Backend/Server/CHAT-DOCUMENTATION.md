# 💬 Sistema de Chat - Documentação

## 📋 Visão Geral

Sistema de chat em tempo real via WebSocket que armazena conversas em **arquivos JSON** na pasta `data_Chat/`.

### Características
- ✅ Comunicação em tempo real via WebSocket
- ✅ API REST para histórico de mensagens
- ✅ Armazenamento em arquivos JSON (sem banco de dados)
- ✅ Validação cliente ↔ prestador
- ✅ Autenticação via JWT
- ✅ Marcação de mensagens como lidas

---

## 📁 Estrutura de Arquivos

### Pasta de Dados
```
Backend/Server/data_Chat/
├── 510 - Chat Maria Silva e João Técnico.json
├── 715 - Chat Pedro Santos e Ana Costa.json
└── ...
```

### Formato do Nome do Arquivo
```
{clienteId}{prestadorId} - Chat {nomeCliente} e {nomePrestador}.json
```

**Exemplo:**
- Cliente ID: 5, Nome: "Maria Silva"
- Prestador ID: 10, Nome: "João Técnico"
- **Arquivo:** `510 - Chat Maria Silva e João Técnico.json`

### Estrutura do JSON

```json
{
  "clienteId": 5,
  "prestadorId": 10,
  "clienteNome": "Maria Silva",
  "prestadorNome": "João Técnico",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "messages": [
    {
      "id": 1,
      "senderId": 5,
      "senderNome": "Maria Silva",
      "message": "Olá, preciso de um orçamento",
      "isRead": true,
      "createdAt": "2024-01-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "senderId": 10,
      "senderNome": "João Técnico",
      "message": "Sim, posso ajudar!",
      "isRead": false,
      "createdAt": "2024-01-01T10:05:00.000Z"
    }
  ]
}
```

---

## 📡 API REST Endpoints

### 1. Listar Conversas

**Endpoint:** `GET /chat/rooms`  
**Autenticação:** 🔒 Requerida

**Descrição:** Lista todas as conversas do usuário autenticado

**Response (200):**
```json
[
  {
    "clienteId": 5,
    "prestadorId": 10,
    "clienteNome": "Maria Silva",
    "prestadorNome": "João Técnico",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "unreadCount": 2,
    "lastMessage": {
      "message": "Quando você pode vir?",
      "createdAt": "2024-01-02T10:30:00.000Z"
    }
  }
]
```

---

### 2. Buscar Histórico de Mensagens

**Endpoint:** `GET /chat/messages/:otherUserId`  
**Autenticação:** 🔒 Requerida

**Descrição:** Retorna todas as mensagens com outro usuário e marca como lidas

**Parâmetros:**
- `otherUserId`: ID do outro usuário (cliente ou prestador)

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
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

**Erros:**
- `400`: Chat não permitido (ambos devem ter roles diferentes)

---

### 3. Enviar Mensagem (REST)

**Endpoint:** `POST /chat/messages`  
**Autenticação:** 🔒 Requerida

**Body:**
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
  "createdAt": "2024-01-02T11:00:00.000Z"
}
```

**Erros:**
- `400`: Campos obrigatórios ausentes
- `400`: Chat não permitido

---

## 🔌 WebSocket API

### Conexão

**URL:** `ws://localhost:3000/chat?token=<seu-jwt-token>`

**Exemplo (JavaScript):**
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const ws = new WebSocket(`ws://localhost:3000/chat?token=${token}`);

ws.onopen = () => {
  console.log('Conectado!');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Mensagem:', data);
};
```

---

### Mensagens do Servidor → Cliente

#### 1. Conexão Estabelecida
```json
{
  "type": "connected",
  "userId": 5,
  "userName": "Maria Silva",
  "message": "Conectado ao servidor de chat com sucesso."
}
```

#### 2. Nova Mensagem Recebida
```json
{
  "type": "new_message",
  "data": {
    "id": 4,
    "senderId": 10,
    "senderNome": "João Técnico",
    "message": "Olá!",
    "isRead": false,
    "createdAt": "2024-01-02T11:05:00.000Z"
  }
}
```

#### 3. Confirmação de Envio
```json
{
  "type": "message_sent",
  "data": {
    "id": 5,
    "senderId": 5,
    "senderNome": "Maria Silva",
    "message": "Tudo bem!",
    "isRead": false,
    "createdAt": "2024-01-02T11:06:00.000Z"
  }
}
```

#### 4. Mensagens Marcadas Como Lidas
```json
{
  "type": "marked_read",
  "otherUserId": 10
}
```

#### 5. Erro
```json
{
  "type": "error",
  "message": "Descrição do erro"
}
```

---

### Mensagens do Cliente → Servidor

#### 1. Enviar Mensagem
```json
{
  "type": "send_message",
  "otherUserId": 10,
  "message": "Olá, tudo bem?"
}
```

**Campos:**
- `type`: "send_message"
- `otherUserId`: ID do destinatário
- `message`: Texto da mensagem

**Response:**
- Para o remetente: `message_sent`
- Para o destinatário (se online): `new_message`

---

#### 2. Marcar Como Lido
```json
{
  "type": "mark_read",
  "otherUserId": 10
}
```

**Campos:**
- `type`: "mark_read"
- `otherUserId`: ID do outro usuário

**Response:** `marked_read`

---

## 💡 Exemplos de Uso

### Exemplo 1: Cliente Envia Mensagem via REST

```javascript
// 1. Login
const loginRes = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'maria@example.com',
    senha: 'senha123'
  })
});
const { token } = await loginRes.json();

// 2. Enviar mensagem
const msgRes = await fetch('http://localhost:3000/chat/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    otherUserId: 10,
    message: 'Olá, preciso de um orçamento!'
  })
});
const message = await msgRes.json();
console.log('Mensagem enviada:', message);
```

---

### Exemplo 2: Chat em Tempo Real via WebSocket

```javascript
// 1. Login
const loginRes = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@example.com',
    senha: 'senha123'
  })
});
const { token } = await loginRes.json();

// 2. Conectar WebSocket
const ws = new WebSocket(`ws://localhost:3000/chat?token=${token}`);

ws.onopen = () => {
  console.log('Conectado ao chat!');
  
  // 3. Enviar mensagem
  ws.send(JSON.stringify({
    type: 'send_message',
    otherUserId: 5,
    message: 'Sim, posso fazer por R$ 250!'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'new_message') {
    console.log('Nova mensagem:', data.data.message);
  }
  
  if (data.type === 'message_sent') {
    console.log('Mensagem enviada com sucesso!');
  }
};
```

---

### Exemplo 3: Listar e Buscar Histórico

```javascript
const token = 'seu-token-jwt';

// 1. Listar todas as conversas
const roomsRes = await fetch('http://localhost:3000/chat/rooms', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const rooms = await roomsRes.json();
console.log('Minhas conversas:', rooms);

// 2. Buscar histórico com um usuário específico
const historyRes = await fetch('http://localhost:3000/chat/messages/10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const chat = await historyRes.json();
console.log('Histórico:', chat.messages);
```

---

## 🔒 Validações e Segurança

### Regras de Negócio
- ✅ Chat **apenas** entre cliente ↔ prestador
- ✅ Cliente não pode conversar com outro cliente
- ✅ Prestador não pode conversar com outro prestador
- ✅ Autenticação JWT obrigatória (REST e WebSocket)

### Segurança
- 🔐 Token JWT validado em todas as requisições
- 🛡️ Validação de roles antes de criar/acessar conversas
- 📝 Arquivos JSON armazenados em diretório protegido

---

## 📊 Estrutura de Dados no Arquivo JSON

### Campos da Conversa
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `clienteId` | number | ID do usuário cliente |
| `prestadorId` | number | ID do usuário prestador |
| `clienteNome` | string | Nome do cliente |
| `prestadorNome` | string | Nome do prestador |
| `createdAt` | string (ISO) | Data de criação da conversa |
| `messages` | array | Array de mensagens |

### Campos da Mensagem
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID sequencial da mensagem |
| `senderId` | number | ID do remetente |
| `senderNome` | string | Nome do remetente |
| `message` | string | Conteúdo da mensagem |
| `isRead` | boolean | Indica se foi lida |
| `createdAt` | string (ISO) | Data de envio |

---

## 🚀 Como Executar

### 1. Iniciar Servidor
```bash
cd Backend/Server
npm start
```

### 2. Testar
O servidor estará disponível em:
- **HTTP API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000/chat`

### 3. Arquivos de Chat
Os arquivos JSON serão criados automaticamente em:
```
Backend/Server/data_Chat/
```

---

## 🐛 Troubleshooting

### Erro: "Token JWT não fornecido"
**Solução:** Envie o token na query string: `ws://host/chat?token=SEU_TOKEN`

### Erro: "Chat permitido apenas entre cliente e prestador"
**Solução:** Verifique se um usuário é cliente e o outro prestador

### Mensagens não chegam em tempo real
**Causa:** Destinatário está offline  
**Solução:** Mensagens são salvas no arquivo JSON e aparecerão ao buscar histórico

### Arquivo não é criado
**Causa:** Permissões de pasta  
**Solução:** Verifique se o servidor tem permissão de escrita na pasta `data_Chat/`

---

## 📈 Vantagens do Armazenamento em JSON

✅ **Simplicidade:** Sem necessidade de migrations  
✅ **Portabilidade:** Fácil backup e migração  
✅ **Legibilidade:** Arquivos podem ser lidos/editados diretamente  
✅ **Organização:** Um arquivo por conversa  
✅ **Performance:** Leitura/escrita rápida para conversas pequenas  

---

**Documentação gerada em:** 25/11/2025  
**Versão:** 1.0.0  
**Autor:** GitHub Copilot
