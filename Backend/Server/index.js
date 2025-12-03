const app = require('./app');
const http = require('http');
const { WebSocketServer } = require('ws');
const chatModule = require('./routes/chat');
const { setupQuickServiceWebSocket } = require('./wsManager');
const { startReportNotificationScheduler } = require('./jobs/reportNotifications');
const port = 3000;

// Cria servidor HTTP
const server = http.createServer(app);

// Cria servidor WebSocket para Chat
const wss = new WebSocketServer({ server, path: '/chat' });
chatModule.setupWebSocketServer(wss);

// Cria servidor WebSocket para Quick Service
setupQuickServiceWebSocket(server);

// Inicia agendador de notificações de relatórios
startReportNotificationScheduler();

console.log('✅ WebSocket servers configurados');

// Inicia servidor
server.listen(port, () => {
  console.log(`🚀 HTTP Server listening at http://localhost:${port}`);
  console.log(`💬 WebSocket Chat listening at ws://localhost:${port}/chat`);
  console.log(`⚡ WebSocket Quick Service listening at ws://localhost:${port}/quick-service-ws`);
});