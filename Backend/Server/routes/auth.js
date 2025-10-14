// routes/auth.js
const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

const tokenBlacklist = [];

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Função auxiliar para buscar roles do usuário
async function getUserRoles(userId) {
  const rolesRes = await db`
    SELECT role FROM role_user WHERE user_id = ${userId}
  `;
  return rolesRes.map(r => r.role);
}

// Cadastro de usuário (cliente ou prestador)
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone, cep, cpf, bio, role } = req.body;

    // Apenas cliente ou prestador podem se registrar
    if (!['cliente', 'prestador'].includes(role)) {
      return res.status(403).json({ error: 'Cadastro disponível apenas para cliente ou prestador.' });
    }

    if (!nome || !email || !senha || !cpf) {
      return res.status(400).json({ error: 'nome, email, senha e cpf são obrigatórios.' });
    }

    // Verifica se já existe usuário com o mesmo email ou cpf
    const exists = await db`
      SELECT id FROM users WHERE email = ${email} OR cpf = ${cpf}
    `;
    if (exists.length > 0) {
      return res.status(409).json({ error: 'Email ou CPF já cadastrado.' });
    }

    const hashed = await bcrypt.hash(senha, SALT_ROUNDS);

    // Insere usuário
    const result = await db`
      INSERT INTO users (nome, email, senha, telefone, cep, cpf, bio)
      VALUES (${nome}, ${email}, ${hashed}, ${telefone || null}, ${cep || null}, ${cpf}, ${bio || null})
      RETURNING id, nome, email, telefone, cep, cpf, bio
    `;
    const userId = result[0].id;

    // Insere role
    await db`
      INSERT INTO role_user (user_id, role) VALUES (${userId}, ${role})
    `;

    res.status(201).json({ user: result[0], role });
  } catch (err) {
    console.error('REGISTER ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login de usuário (qualquer tipo)
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'email e senha são obrigatórios.' });

    const uRes = await db`
      SELECT id, nome, email, senha FROM users WHERE email = ${email}
    `;
    if (uRes.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }
    const user = uRes[0];

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(400).json({ error: 'Credenciais inválidas.' });

    // Busca roles do usuário
    const roles = await getUserRoles(user.id);

    const token = jwt.sign(
      { userId: user.id, roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, roles } });
  } catch (err) {
    console.error('LOGIN ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ error: 'Token não fornecido no cabeçalho Authorization' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(400).json({ error: 'Formato de token inválido. Use: Bearer [token]' });
  }
  const token = parts[1];
  if (!tokenBlacklist.includes(token)) {
    tokenBlacklist.push(token);
  }
  res.json({ message: 'Logout realizado com sucesso. O token foi invalidado.' });
});

// Endpoint para obter dados do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db`
      SELECT id, nome, email, telefone, cep, cpf, bio FROM users WHERE id = ${userId}
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Busca roles
    const roles = await getUserRoles(userId);
    res.json({ ...result[0], roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  router,
  tokenBlacklist
};