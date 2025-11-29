# 🚀 Sistema de Chat - Guia Rápido

## 📦 O que foi implementado?

Sistema de chat em tempo real que armazena conversas em **arquivos JSON** na pasta `data_Chat/`.

### Arquivos Criados
- ✅ `routes/chat.js` - Rotas REST e WebSocket
- ✅ `data_Chat/` - Pasta para arquivos de conversas
- ✅ `CHAT-DOCUMENTATION.md` - Documentação completa

### Integrações
- ✅ `app.js` - Rotas REST adicionadas
- ✅ `index.js` - WebSocket Server configurado

---

## 🏁 Como Usar

### 1️⃣ Iniciar Servidor
```bash
cd Backend/Server
npm start
```

Você verá:
```
🚀 HTTP Server listening at http://localhost:3000
💬 WebSocket Server listening at ws://localhost:3000/chat
```

### 2️⃣ Endpoints Disponíveis

#### REST API
- `GET /chat/rooms` - Lista conversas do usuário
- `GET /chat/messages/:otherUserId` - Histórico com outro usuário
- `POST /chat/messages` - Envia mensagem via REST

#### WebSocket
- `ws://localhost:3000/chat?token=SEU_JWT`
- Enviar: `{ type: 'send_message', otherUserId: 10, message: 'Olá!' }`
- Marcar lido: `{ type: 'mark_read', otherUserId: 10 }`

---

## 📁 Estrutura dos Arquivos

### Nome do Arquivo
```
{clienteId}{prestadorId} - Chat {nomeCliente} e {nomePrestador}.json
```

**Exemplo:**
```
510 - Chat Maria Silva e João Técnico.json
```

### Conteúdo do JSON
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
      "message": "Olá!",
      "isRead": true,
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

---

## ✅ Regras Importantes

1. **Chat só funciona entre cliente ↔ prestador**
   - Sistema valida automaticamente os roles

2. **Arquivos criados automaticamente**
   - Ao enviar primeira mensagem entre dois usuários

3. **Mensagens persistidas**
   - Salvos em JSON imediatamente após envio

---

## 💡 Exemplo Rápido (JavaScript)

### Via REST API
```javascript
// Login
const loginRes = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'maria@example.com', senha: 'senha123' })
});
const { token } = await loginRes.json();

// Enviar mensagem
await fetch('http://localhost:3000/chat/messages', {
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

// Buscar histórico
const historyRes = await fetch('http://localhost:3000/chat/messages/10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const chat = await historyRes.json();
console.log(chat.messages);
```

### Via WebSocket
```javascript
const ws = new WebSocket(`ws://localhost:3000/chat?token=${token}`);

ws.onopen = () => {
  // Enviar mensagem
  ws.send(JSON.stringify({
    type: 'send_message',
    otherUserId: 10,
    message: 'Olá!'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new_message') {
    console.log('Nova mensagem:', data.data.message);
  }
};
```

---

## 🔧 Testar Manualmente

### 1. Criar dois usuários
```bash
# Cliente
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@example.com","senha":"senha123","cpf":"12345678901","role":"cliente"}'

# Prestador
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Técnico","email":"joao@example.com","senha":"senha123","cpf":"98765432100","role":"prestador"}'
```

### 2. Login e enviar mensagem
```bash
# Login como cliente
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha123"}'
# Copie o token

# Enviar mensagem
curl -X POST http://localhost:3000/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"otherUserId":PRESTADOR_ID,"message":"Olá!"}'
```

### 3. Verificar arquivo criado
```bash
ls data_Chat/
cat "data_Chat/510 - Chat Maria Silva e João Técnico.json"
```

---

## 📂 Localização dos Arquivos

```
Backend/Server/data_Chat/
├── 510 - Chat Maria Silva e João Técnico.json
├── 715 - Chat Pedro Santos e Ana Costa.json
└── ... (criados automaticamente)
```

---

## 📚 Documentação Completa

Veja **CHAT-DOCUMENTATION.md** para:
- Referência completa da API
- Exemplos detalhados
- Estrutura de dados
- Troubleshooting

---

## 🎯 Próximos Passos

1. **Testar com usuários reais** do seu banco de dados
2. **Integrar com o frontend** (React Native/Web)
3. **Adicionar notificações** para mensagens offline
4. **Implementar anexos** (imagens, arquivos)

---

**Criado em:** 25/11/2025  
**Autor:** GitHub Copilot
