const express = require('express');
const dbModule = require('./db.mjs'); 
const db = dbModule.default;
const cors = require('cors');

const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/services');

const authModule = require('./routes/auth');
const authRouter = authModule.router;

const tokenBlacklist = authModule.tokenBlacklist;

const authMiddleware = require('./middleware/auth');
authMiddleware.setTokenBlacklist


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/auth', authRouter);
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});