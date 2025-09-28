// routes/auth.js
const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs'); 
const db = dbModule.default; 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenBlacklist = [];

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const nome = req.body.nome || req.body.name;
    const email = req.body.email;
    const password = req.body.password || req.body.senha;
    const telefone = req.body.telefone || null;
    const cidade = req.body.cidade || null;
    const estado = req.body.estado || null;
    const cpf = req.body.cpf || null;

    if (!nome || !email || !password || !cpf) {
      return res.status(400).json({ error: 'nome, email, password e cpf são obrigatórios' });
    }

    const exists = await db`SELECT id FROM usuarios WHERE email = ${email}`;

    if (exists.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db`
      INSERT INTO usuarios (nome, email, senha, telefone, cidade, estado, cpf)
       VALUES (${nome}, ${email}, ${hashed}, ${telefone}, ${cidade}, ${estado}, ${cpf})
       RETURNING id, nome, email, telefone, cidade, estado, cpf`;


    try {

      await db`
        INSERT INTO usuario_senhas (usuario_id, hash, salt, ativo)
         VALUES (${result[0].id}, ${hashed}, '', true)`; 
    } catch (err) {
      if (err && err.code === '42P01') {

        console.info('usuario_senhas não existe; pulando inserção de histórico de senhas.');
      } else {
        console.warn('Erro ao tentar inserir em usuario_senhas (ignorando):', err.message || err);
      }
    }

    res.status(201).json({ user: result[0] }); 
  } catch (err) {
    console.error('REGISTER ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password || req.body.senha;
    if (!email || !password) return res.status(400).json({ error: 'email e password são obrigatórios' });


    const uRes = await db`SELECT id, nome, email, senha FROM usuarios WHERE email = ${email}`;

    if (uRes.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const user = uRes[0]; 

    if (user.senha) {

      if (typeof user.senha === 'string' && user.senha.startsWith && user.senha.startsWith('$2')) {
        const ok = await bcrypt.compare(password, user.senha);
        if (ok) {
          const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
          return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
        }

      } else {

        console.warn(`usuarios.senha para usuário ${user.id} não parece ser bcrypt (prefixo inesperado). Tentando usuario_senhas...`);
      }
    }


    try {

      const hsRes = await db`
         SELECT hash FROM usuario_senhas
         WHERE usuario_id = ${user.id} AND ativo = true
         ORDER BY criado_em DESC
         LIMIT 1`;


      if (hsRes.length > 0) {
        const hash = hsRes[0].hash; 
        if (typeof hash === 'string' && hash.startsWith && hash.startsWith('$2')) {
          const ok2 = await bcrypt.compare(password, hash);
          if (ok2) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
          } else {
            return res.status(400).json({ error: 'Credenciais inválidas' });
          }
        } else {

          console.warn(`Hash em usuario_senhas para usuario ${user.id} não é bcrypt — não é possível comparar com bcrypt.`);
          return res.status(400).json({ error: 'Credenciais inválidas (hash em formato incompatível)' });
        }
      } else {

        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
    } catch (err2) {

      if (err2 && err2.code === '42P01') {
        console.info('Tabela usuario_senhas não existe; já tentamos usuarios.senha. Retornando credenciais inválidas.');
        return res.status(400).json({ error: 'Credenciais inválidas' });
      } else {
        console.error('Erro ao consultar usuario_senhas:', err2);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  } catch (err) {
    console.error('LOGIN ERROR', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// LOGOUT 

router.post('/logout', (req, res) => {
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
    console.log(`Token revogado e adicionado à blacklist. Tokens revogados: ${tokenBlacklist.length}`);
  }

  res.json({ message: 'Logout realizado com sucesso. O token foi invalidado.' });
});


const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db`SELECT id, nome, email, telefone, cidade, estado, cpf FROM usuarios WHERE id = ${userId}`;

    if (result.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result[0]); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = {
  router,
  tokenBlacklist
};