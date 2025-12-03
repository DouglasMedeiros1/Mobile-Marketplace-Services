// wsManager.js - Sistema de WebSocket para Serviços Rápidos
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

let wsServer = null;
const activeConnections = new Map(); // userId → WebSocket
const quickServiceResponses = new Map(); // requestId → { resolve, timeout }

/**
 * Configura servidor WebSocket para serviços rápidos
 * @param {http.Server} httpServer - Servidor HTTP
 * @returns {Object} Funções de gerenciamento do WebSocket
 */
function setupQuickServiceWebSocket(httpServer) {
  wsServer = new WebSocketServer({ 
    server: httpServer, 
    path: '/quick-service-ws' 
  });

  wsServer.on('connection', async (ws, req) => {
    let userId = null;
    const token = new URLSearchParams(req.url.split('?')[1]).get('token');

    if (!token) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Token JWT não fornecido. Use: ws://host/quick-service-ws?token=xxx' 
      }));
      return ws.close();
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      userId = payload.userId || payload.user_id || payload.id;
      
      if (!userId) throw new Error('userId não encontrado no token');

      const userResult = await db`SELECT nome FROM users WHERE id = ${userId}`;
      if (userResult.length === 0) throw new Error('Usuário não encontrado');

      const userRoles = payload.roles || [];
      if (!userRoles.includes('cliente') && !userRoles.includes('prestador')) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Acesso permitido apenas para clientes e prestadores.' 
        }));
        return ws.close();
      }

      activeConnections.set(userId, ws);
      ws.send(JSON.stringify({ 
        type: 'connected', 
        userId, 
        message: 'Conectado ao servidor de serviços rápidos.' 
      }));

    } catch (err) {
      console.error('WebSocket auth error:', err);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Token inválido ou expirado.' 
      }));
      return ws.close();
    }

    ws.on('message', async (data) => {
      try {
        const { type, requestId, action } = JSON.parse(data.toString());

        if (type === 'quick_service_response') {
          // Resposta de prestador para solicitação de serviço rápido
          if (!requestId || !action) {
            return ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'requestId e action são obrigatórios para quick_service_response.' 
            }));
          }

          if (quickServiceResponses.has(requestId)) {
            const { resolve, timeout } = quickServiceResponses.get(requestId);
            clearTimeout(timeout);
            quickServiceResponses.delete(requestId);
            resolve(action); // 'accept' ou 'reject'
          }
        } else {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Tipo de mensagem inválido: ${type}` 
          }));
        }
      } catch (err) {
        console.error('WebSocket message handler error:', err);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Erro ao processar mensagem.' 
        }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        activeConnections.delete(userId);
        console.log(`[Quick Service WS] Desconectado userId: ${userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('[Quick Service WS] Error:', error);
      if (userId) activeConnections.delete(userId);
    });
  });

  console.log('✅ WebSocket server configurado para /quick-service-ws');
}

/**
 * Notifica usuário específico
 * @param {number} userId - ID do usuário
 * @param {Object} payload - Dados a enviar
 * @returns {boolean} True se enviado com sucesso
 */
function notifyUser(userId, payload) {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

/**
 * Envia solicitação de serviço rápido e aguarda resposta
 * @param {number} userId - ID do prestador
 * @param {Object} payload - Dados da solicitação
 * @param {number} timeoutMs - Timeout em ms (padrão 15000)
 * @returns {Promise<string>} 'accept' ou 'reject'
 */
function sendQuickServiceRequest(userId, payload, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const ws = activeConnections.get(userId);
    
    if (!ws || ws.readyState !== 1) {
      return reject(new Error('Prestador não conectado via WebSocket'));
    }

    // Enviar notificação
    ws.send(JSON.stringify(payload));

    // Configurar timeout
    const timeout = setTimeout(() => {
      quickServiceResponses.delete(payload.requestId);
      reject(new Error('Timeout: prestador não respondeu'));
    }, timeoutMs);

    // Armazenar resolver e timeout
    quickServiceResponses.set(payload.requestId, { resolve, timeout });
  });
}

/**
 * Verifica se usuário está conectado
 * @param {number} userId - ID do usuário
 * @returns {boolean}
 */
function isUserConnected(userId) {
  const ws = activeConnections.get(userId);
  return ws && ws.readyState === 1;
}

/**
 * Obtém quantidade de conexões ativas
 * @returns {number}
 */
function getActiveConnectionsCount() {
  return activeConnections.size;
}

/**
 * Envia notificação de relatório para usuário
 * @param {number} userId - ID do usuário
 * @param {Object} notification - Dados da notificação
 * @returns {boolean} True se enviado com sucesso
 */
function sendNotificationToUser(userId, notification) {
  const payload = {
    type: 'notification',
    ...notification
  };
  return notifyUser(userId, payload);
}

module.exports = {
  setupQuickServiceWebSocket,
  notifyUser,
  sendQuickServiceRequest,
  isUserConnected,
  getActiveConnectionsCount,
  sendNotificationToUser
};
