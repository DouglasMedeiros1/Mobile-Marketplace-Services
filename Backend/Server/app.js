const express = require('express');
const dbModule = require('./db.mjs'); 
const db = dbModule.default;
const cors = require('cors');

const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/services');
const companyRoutes = require('./routes/company');
const proposalsRoutes = require('./routes/proposals');
const rolesRoutes = require('./routes/roles');
const chatModule = require('./routes/chat');
const chatRouter = chatModule.router;
const quickServiceRouter = require('./routes/quickService');
const dashboardsRouter = require('./routes/dashboards');

const authModule = require('./routes/auth');
const authRouter = authModule.router;

const { authenticateToken } = require('./middleware/auth');
const { cleanupExpired } = require('./utils/quickServiceStorage');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Rotas públicas
app.use('/auth', authRouter);

// Rotas de serviços (GET público, POST/PUT/DELETE protegidos dentro da rota)
app.use('/services', serviceRoutes);

// Rotas protegidas
app.use('/user', authenticateToken, userRoutes);
app.use('/user', authenticateToken, rolesRoutes); // Gerenciamento de roles
app.use('/company', authenticateToken, companyRoutes);
app.use('/proposals', authenticateToken, proposalsRoutes);
app.use('/chat', authenticateToken, chatRouter); // Rotas REST de chat
app.use('/quick-service', authenticateToken, quickServiceRouter); // Rotas de serviço rápido
app.use('/dashboards', authenticateToken, dashboardsRouter); // Dashboards de métricas

// Timer de cleanup para arquivos JSON expirados (executa a cada 60 segundos)
setInterval(() => {
  cleanupExpired().catch(err => {
    console.error('Erro no cleanup de dados expirados:', err);
  });
}, 60000);

console.log('✅ Timer de cleanup configurado (60s)');

module.exports = app;