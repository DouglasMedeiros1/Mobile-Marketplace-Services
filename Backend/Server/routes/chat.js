// routes/chat.js - Sistema de Chat em Tempo Real via WebSocket
// Armazena conversas em JSON: {clienteId}{prestadorId} - Chat {nomeCliente} e {nomePrestador}.json

const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const CHAT_DATA_DIR = path.join(__dirname, '..', 'data_Chat');

// Funções auxiliares de arquivo
async function ensureChatDirectory() {
  try {
    await fs.access(CHAT_DATA_DIR);
  } catch {
    await fs.mkdir(CHAT_DATA_DIR, { recursive: true });
  }
}

function getChatFileName(clienteId, prestadorId, clienteNome, prestadorNome) {
  return `${clienteId}${prestadorId} - Chat ${clienteNome} e ${prestadorNome}.json`;
}

async function loadOrCreateChat(clienteId, prestadorId, clienteNome, prestadorNome) {
  await ensureChatDirectory();
  const filePath = path.join(CHAT_DATA_DIR, getChatFileName(clienteId, prestadorId, clienteNome, prestadorNome));

  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    const newChat = { clienteId, prestadorId, clienteNome, prestadorNome, createdAt: new Date().toISOString(), messages: [] };
    await fs.writeFile(filePath, JSON.stringify(newChat, null, 2), 'utf-8');
    return newChat;
  }
}

async function saveChat(clienteId, prestadorId, clienteNome, prestadorNome, chatData) {
  const filePath = path.join(CHAT_DATA_DIR, getChatFileName(clienteId, prestadorId, clienteNome, prestadorNome));
  await fs.writeFile(filePath, JSON.stringify(chatData, null, 2), 'utf-8');
}

async function listUserChats(userId) {
  await ensureChatDirectory();
  const files = await fs.readdir(CHAT_DATA_DIR);
  const userChats = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const chat = JSON.parse(await fs.readFile(path.join(CHAT_DATA_DIR, file), 'utf-8'));

    if (chat.clienteId === userId || chat.prestadorId === userId) {
      const unreadCount = chat.messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
      const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;

      userChats.push({
        clienteId: chat.clienteId,
        prestadorId: chat.prestadorId,
        clienteNome: chat.clienteNome,
        prestadorNome: chat.prestadorNome,
        createdAt: chat.createdAt,
        unreadCount,
        lastMessage: lastMessage ? { message: lastMessage.message, createdAt: lastMessage.createdAt } : null
      });
    }
  }
  return userChats;
}

// Valida se dois usuários podem conversar (cliente <-> prestador)
async function validateChatParticipants(userId1, userId2) {
  const users = await db`
    SELECT u.id, u.nome, ARRAY_AGG(ru.role) as roles
    FROM users u
    LEFT JOIN role_user ru ON u.id = ru.user_id
    WHERE u.id IN (${userId1}, ${userId2})
    GROUP BY u.id, u.nome
  `;

  if (users.length !== 2) return { valid: false };

  const user1 = users.find(u => u.id === userId1);
  const user2 = users.find(u => u.id === userId2);
  const user1Roles = user1.roles || [];
  const user2Roles = user2.roles || [];

  if (user1Roles.includes('cliente') && user2Roles.includes('prestador')) {
    return { valid: true, clienteId: userId1, prestadorId: userId2, clienteNome: user1.nome, prestadorNome: user2.nome };
  } else if (user1Roles.includes('prestador') && user2Roles.includes('cliente')) {
    return { valid: true, clienteId: userId2, prestadorId: userId1, clienteNome: user2.nome, prestadorNome: user1.nome };
  }
  return { valid: false };
}

// REST API Endpoints
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    res.json(await listUserChats(req.user.id));
  } catch (err) {
    console.error('GET /chat/rooms ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const validation = await validateChatParticipants(req.user.id, parseInt(req.params.otherUserId));
    if (!validation.valid) return res.status(400).json({ error: 'Chat permitido apenas entre cliente e prestador.' });

    const chat = await loadOrCreateChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome);
    let hasUnread = false;
    
    chat.messages.forEach(msg => {
      if (msg.senderId !== req.user.id && !msg.isRead) {
        msg.isRead = true;
        hasUnread = true;
      }
    });

    if (hasUnread) await saveChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome, chat);
    res.json({ clienteId: chat.clienteId, prestadorId: chat.prestadorId, clienteNome: chat.clienteNome, prestadorNome: chat.prestadorNome, messages: chat.messages });
  } catch (err) {
    console.error('GET /chat/messages/:otherUserId ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { otherUserId, message } = req.body;
    if (!otherUserId || !message) return res.status(400).json({ error: 'otherUserId e message são obrigatórios.' });

    const validation = await validateChatParticipants(req.user.id, parseInt(otherUserId));
    if (!validation.valid) return res.status(400).json({ error: 'Chat permitido apenas entre cliente e prestador.' });

    const chat = await loadOrCreateChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome);
    const sender = await db`SELECT nome FROM users WHERE id = ${req.user.id}`;
    
    const newMessage = {
      id: chat.messages.length + 1,
      senderId: req.user.id,
      senderNome: sender[0].nome,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    chat.messages.push(newMessage);
    await saveChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome, chat);
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('POST /chat/messages ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// WebSocket Handler
function setupWebSocketServer(wss) {
  const activeConnections = new Map();

  wss.on('connection', async (ws, req) => {
    let userId = null, userName = null;
    const token = new URLSearchParams(req.url.split('?')[1]).get('token');

    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Token JWT não fornecido. Use: ws://host/chat?token=xxx' }));
      return ws.close();
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      userId = payload.userId || payload.user_id || payload.id;
      if (!userId) throw new Error('userId não encontrado no token');

      const userResult = await db`SELECT nome FROM users WHERE id = ${userId}`;
      if (userResult.length === 0) throw new Error('Usuário não encontrado');
      userName = userResult[0].nome;

      const userRoles = payload.roles || [];
      if (!userRoles.includes('cliente') && !userRoles.includes('prestador')) {
        ws.send(JSON.stringify({ type: 'error', message: 'Acesso ao chat permitido apenas para clientes e prestadores.' }));
        return ws.close();
      }

      activeConnections.set(userId, ws);
      ws.send(JSON.stringify({ type: 'connected', userId, userName, message: 'Conectado ao servidor de chat com sucesso.' }));

    } catch (err) {
      console.error('WebSocket auth error:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Token inválido ou expirado.' }));
      return ws.close();
    }

    ws.on('message', async (data) => {
      try {
        const { type, otherUserId, message } = JSON.parse(data.toString());

        if (type === 'send_message') {
          if (!otherUserId || !message) return ws.send(JSON.stringify({ type: 'error', message: 'otherUserId e message são obrigatórios.' }));

          const validation = await validateChatParticipants(userId, otherUserId);
          if (!validation.valid) return ws.send(JSON.stringify({ type: 'error', message: 'Chat permitido apenas entre cliente e prestador.' }));

          const chat = await loadOrCreateChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome);
          const newMessage = {
            id: chat.messages.length + 1,
            senderId: userId,
            senderNome: userName,
            message,
            isRead: false,
            createdAt: new Date().toISOString()
          };

          chat.messages.push(newMessage);
          await saveChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome, chat);

          ws.send(JSON.stringify({ type: 'message_sent', data: newMessage }));
          const recipientWs = activeConnections.get(otherUserId);
          if (recipientWs && recipientWs.readyState === ws.OPEN) {
            recipientWs.send(JSON.stringify({ type: 'new_message', data: newMessage }));
          }
        } else if (type === 'mark_read') {
          if (!otherUserId) return ws.send(JSON.stringify({ type: 'error', message: 'otherUserId é obrigatório para mark_read.' }));

          const validation = await validateChatParticipants(userId, otherUserId);
          if (!validation.valid) return ws.send(JSON.stringify({ type: 'error', message: 'Chat não encontrado.' }));

          const chat = await loadOrCreateChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome);
          let hasUnread = false;
          
          chat.messages.forEach(msg => {
            if (msg.senderId !== userId && !msg.isRead) {
              msg.isRead = true;
              hasUnread = true;
            }
          });

          if (hasUnread) await saveChat(validation.clienteId, validation.prestadorId, validation.clienteNome, validation.prestadorNome, chat);
          ws.send(JSON.stringify({ type: 'marked_read', otherUserId }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `Tipo de mensagem inválido: ${type}` }));
        }
      } catch (err) {
        console.error('WebSocket message handler error:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Erro ao processar mensagem.' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        activeConnections.delete(userId);
        console.log(`WebSocket closed for userId: ${userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userId) activeConnections.delete(userId);
    });
  });

  console.log('✅ WebSocket server configurado para /chat');
}

module.exports = { router, setupWebSocketServer };
