// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // seu db.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenBlacklist = [];

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// REGISTER
// ... (código REGISTER não alterado) ...
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

    // verifica email existente
    const exists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, cidade, estado, cpf)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, nome, email, telefone, cidade, estado, cpf`,
      [nome, email, hashed, telefone, cidade, estado, cpf]
    );

    // tentar também inserir histórico em usuario_senhas se existir (não quebra caso não exista)
    try {
      await db.query(
        `INSERT INTO usuario_senhas (usuario_id, hash, salt, ativo)
         VALUES ($1, $2, $3, true)`,
        [result.rows[0].id, hashed, ''] // salt deixamos string vazia pois bcrypt já inclui salt no hash
      );
    } catch (err) {
      if (err && err.code === '42P01') {
        // tabela não existe — ok, só ignoramos
        console.info('usuario_senhas não existe; pulando inserção de histórico de senhas.');
      } else {
        console.warn('Erro ao tentar inserir em usuario_senhas (ignorando):', err.message || err);
      }
    }

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('REGISTER ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// LOGIN
// ... (código LOGIN não alterado) ...
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password || req.body.senha;
    if (!email || !password) return res.status(400).json({ error: 'email e password são obrigatórios' });

    const uRes = await db.query('SELECT id, nome, email, senha FROM usuarios WHERE email = $1', [email]);
    if (uRes.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const user = uRes.rows[0];

    // 1) tenta comparar com usuarios.senha (se preenchido)
    if (user.senha) {
      // checar prefixo bcrypt para evitar exceção em formatos desconhecidos
      if (typeof user.senha === 'string' && user.senha.startsWith && user.senha.startsWith('$2')) {
        const ok = await bcrypt.compare(password, user.senha);
        if (ok) {
          const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
          return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
        }
        // se falhar, continua para tentar usuario_senhas (se existir)
      } else {
        // senha armazenada em formato não-bcrypt (ex: MD5 ou outro) — vamos tentar usuario_senhas antes de falhar
        console.warn(`usuarios.senha para usuário ${user.id} não parece ser bcrypt (prefixo inesperado). Tentando usuario_senhas...`);
      }
    }

    // 2) tenta buscar último hash ativo em usuario_senhas (se tabela existe)
    try {
      const hsRes = await db.query(
        `SELECT hash FROM usuario_senhas
         WHERE usuario_id = $1 AND ativo = true
         ORDER BY criado_em DESC
         LIMIT 1`, [user.id]);

      if (hsRes.rows.length > 0) {
        const hash = hsRes.rows[0].hash;
        if (typeof hash === 'string' && hash.startsWith && hash.startsWith('$2')) {
          const ok2 = await bcrypt.compare(password, hash);
          if (ok2) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
          } else {
            return res.status(400).json({ error: 'Credenciais inválidas' });
          }
        } else {
          // hash presente mas não é bcrypt
          console.warn(`Hash em usuario_senhas para usuario ${user.id} não é bcrypt — não é possível comparar com bcrypt.`);
          return res.status(400).json({ error: 'Credenciais inválidas (hash em formato incompatível)' });
        }
      } else {
        // não encontrou hash em usuario_senhas
        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
    } catch (err2) {
      // se a tabela usuario_senhas não existir, o erro tem code '42P01' — lidamos sem alterar DB
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


// LOGOUT (Novo)
// Nota: Não precisa de authMiddleware aqui porque o objetivo é invalidar o token atual.
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ error: 'Token não fornecido no cabeçalho Authorization' });
  }

  // Espera-se "Bearer [token]"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(400).json({ error: 'Formato de token inválido. Use: Bearer [token]' });
  }

  const token = parts[1];

  // Adiciona o token à blacklist
  if (!tokenBlacklist.includes(token)) {
    tokenBlacklist.push(token);
    console.log(`Token revogado e adicionado à blacklist. Tokens revogados: ${tokenBlacklist.length}`);
    // Opcional: para evitar que a lista cresça para sempre em um projeto pequeno,
    // você poderia limpar tokens expirados, mas para simplificar, vamos deixar como está.
  }

  // Sucesso, mesmo que o token já estivesse na lista (para evitar vazamento de informação)
  res.json({ message: 'Logout realizado com sucesso. O token foi invalidado.' });
});

// Rota /me (exemplo). Requer middleware auth
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT id, nome, email, telefone, cidade, estado, cpf FROM usuarios WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Exporta a blacklist para que o middleware possa acessá-la
module.exports = {
  router,
  tokenBlacklist
};
