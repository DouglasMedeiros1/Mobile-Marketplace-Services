const express = require('express');
const dbModule = require('./db.mjs'); 
const db = dbModule.default;
const cors = require('cors');

const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/services');
const companyRoutes = require('./routes/company');
const proposalsRoutes = require('./routes/proposals');

const authModule = require('./routes/auth');
const authRouter = authModule.router;

const { authenticateToken } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Rotas públicas
app.use('/auth', authRouter);

// Rotas protegidas
app.use('/users', authenticateToken, userRoutes);
app.use('/services', authenticateToken, serviceRoutes);
app.use('/company', authenticateToken, companyRoutes);
app.use('/proposals', authenticateToken, proposalsRoutes);

module.exports = app;