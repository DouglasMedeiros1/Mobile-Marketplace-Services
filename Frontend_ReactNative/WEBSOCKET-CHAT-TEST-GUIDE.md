# 🧪 Guia de Teste - WebSocket Chat

## 📋 Configuração Atual

### Usuários Configurados no Banco de Dados

| ID | Nome | Email | Role | Senha |
|----|------|-------|------|-------|
| 1 | Maria Silva | maria@example.com | **cliente** | senha123 |
| 5 | João Técnico | joao@example.com | **prestador** | senha123 |

### Regra de Negócio
⚠️ **Chat só funciona entre CLIENTE ↔ PRESTADOR**
- Cliente NÃO pode conversar com cliente
- Prestador NÃO pode conversar com prestador
- Cliente PODE conversar com prestador ✅
- Prestador PODE conversar com cliente ✅

---

## 🚀 Como Testar

### Opção 1: Teste Completo (2 Dispositivos/Emuladores)

1. **Dispositivo 1 - Login como Maria (Cliente)**
   ```
   Email: maria@example.com
   Senha: senha123
   ```

2. **Dispositivo 2 - Login como João (Prestador)**
   ```
   Email: joao@example.com
   Senha: senha123
   ```

3. **No Dispositivo 1 (Maria):**
   - Vá para a tela de Chat
   - WebSocket conectará automaticamente
   - Clique no botão "João Técnico (Prestador)"
   - Envie uma mensagem
   - ✅ João receberá a mensagem no Dispositivo 2

4. **No Dispositivo 2 (João):**
   - Vá para a tela de Chat
   - Clique no botão "Maria Silva (Cliente)"
   - Responda a mensagem
   - ✅ Maria receberá a mensagem no Dispositivo 1

---

### Opção 2: Teste Simples (1 Dispositivo)

1. **Faça login como Maria (Cliente)**
   ```
   Email: maria@example.com
   Senha: senha123
   ```

2. **Navegue para Chat**
   - Observe o status de conexão mudar para "Conectado" (verde)
   - Veja o alert: "WebSocket Conectado"

3. **Clique em "João Técnico (Prestador)"**
   - Isso abrirá a ChatScreen com `userId: 5`

4. **Envie mensagem de teste**
   - Clique no botão "🧪 Teste" ou
   - Digite uma mensagem e clique em ➤

5. **Verifique o console**
   - Deve aparecer logs com emojis:
     ```
     🔄 WebSocket: Attempting to connect...
     ✅ WebSocket: Connection established successfully
     📨 WebSocket: Message received: connected
     📤 ChatScreen: Sending message: ...
     📨 WebSocket: Message received: message_sent
     ```

6. **Verifique a tela**
   - As mensagens aparecerão em cards na tela
   - Status será exibido no topo

---

## 🔍 Debug e Logs

### Logs do WebSocket (Frontend)

Os logs agora usam emojis para fácil identificação:

- `🔄` = Tentando conectar
- `✅` = Conexão estabelecida
- `📨` = Mensagem recebida
- `📤` = Mensagem enviada
- `❌` = Erro
- `⚠️` = Aviso
- `🔌` = Desconexão
- `🎯` = Handler registrado/desregistrado
- `📱` = App mudou de estado (background/foreground)

### Logs do Backend

No terminal do servidor, você verá:
```
WebSocket closed for userId: 1
```

---

## 📝 Formato de Mensagem WebSocket

### Enviar Mensagem (Frontend → Backend)
```json
{
  "type": "send_message",
  "otherUserId": 5,
  "message": "Olá João!"
}
```

### Resposta (Backend → Frontend)
```json
{
  "type": "message_sent",
  "data": {
    "id": 1,
    "senderId": 1,
    "senderNome": "Maria Silva",
    "message": "Olá João!",
    "isRead": false,
    "createdAt": "2025-12-01T06:20:00.000Z"
  }
}
```

### Mensagem Recebida (Backend → Destinatário)
```json
{
  "type": "new_message",
  "data": {
    "id": 1,
    "senderId": 1,
    "senderNome": "Maria Silva",
    "message": "Olá João!",
    "isRead": false,
    "createdAt": "2025-12-01T06:20:00.000Z"
  }
}
```

---

## 🐛 Troubleshooting

### WebSocket não conecta

1. **Verifique se está autenticado**
   - Faça logout e login novamente
   - Token JWT pode estar expirado

2. **Verifique o servidor backend**
   ```bash
   cd Backend/Server
   npm start
   ```
   - Servidor deve estar em `http://localhost:3000`

3. **Verifique as variáveis de ambiente**
   - Arquivo: `Frontend_ReactNative/.env`
   - Deve ter: `WS_BASE_URL=ws://10.0.2.2:3000`

### Mensagem não é enviada

1. **Verifique se está conectado**
   - Status deve estar verde "Conectado"

2. **Verifique o otherUserId**
   - Use userId: 1 (Maria) ou 5 (João)
   - Certifique-se de que o destinatário tem role oposta

3. **Verifique o console**
   - Procure por erros com ❌
   - Veja se a mensagem foi enviada com 📤

### "Chat permitido apenas entre cliente e prestador"

Isso significa que:
- Você está tentando conversar com alguém da mesma role
- Ou o usuário não tem role definida

**Solução:**
- Use os usuários corretos: Maria (cliente) ↔ João (prestador)

---

## 📊 Arquivos de Chat Salvos

As conversas são salvas em:
```
Backend/Server/data_Chat/
```

Formato do arquivo:
```
15 - Chat Maria Silva e João Técnico.json
```

Estrutura:
```json
{
  "clienteId": 1,
  "prestadorId": 5,
  "clienteNome": "Maria Silva",
  "prestadorNome": "João Técnico",
  "createdAt": "2025-12-01T06:15:00.000Z",
  "messages": [
    {
      "id": 1,
      "senderId": 1,
      "senderNome": "Maria Silva",
      "message": "Olá!",
      "isRead": false,
      "createdAt": "2025-12-01T06:16:00.000Z"
    }
  ]
}
```

---

## ✅ Checklist de Teste

- [ ] Login realizado com sucesso
- [ ] Navegou para tela de Chat
- [ ] WebSocket conectou (status verde)
- [ ] Alert "WebSocket Conectado" apareceu
- [ ] Mensagem de teste enviada
- [ ] Logs aparecem no console com emojis
- [ ] Mensagens aparecem em cards na tela
- [ ] Auto-reconexão funciona (feche e abra o app)

---

## 🎯 Próximos Passos

Após validar que o WebSocket funciona corretamente:

1. **Implementar lista de conversas** (ChatListScreen)
   - Listar chats existentes
   - Mostrar última mensagem
   - Contador de não lidas

2. **Melhorar UI do ChatScreen**
   - Bubbles de mensagem (esquerda/direita)
   - Scroll automático
   - Indicador de leitura

3. **Notificações Push**
   - Notificar quando receber mensagem
   - Mesmo com app em background

4. **Typing Indicator**
   - Mostrar quando outro usuário está digitando

---

## 📚 Referências

- **WebSocketContext**: `src/contexts/WebSocketContext.tsx`
- **ChatListScreen**: `src/pages/chat/ChatListScreen.tsx`
- **ChatScreen**: `src/pages/chat/ChatScreen.tsx`
- **Backend Chat**: `Backend/Server/routes/chat.js`
- **Types**: `src/types/api.types.ts`
