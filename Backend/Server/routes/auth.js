// routes/auth.js
const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, revokeToken } = require('../middleware/auth');

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
    const { nome, email, senha, telefone, cep, cpf, bio, role = 'cliente' } = req.body;

    // Apenas cliente ou prestador podem se registrar
    if (!['cliente', 'prestador'].includes(role)) {
      return res.status(403).json({ error: 'Cadastro disponível apenas para cliente ou prestador.' });
    }

    if (!nome || !email || !senha || !cpf) {
      return res.status(400).json({ error: 'nome, email, senha e cpf são obrigatórios.' });
    }

    const hashed = await bcrypt.hash(senha, SALT_ROUNDS);

    // Transação para criar usuário e associar role
    const result = await db.begin(async sql => {
      // Insere usuário
      const userResult = await sql`
        INSERT INTO users (nome, email, senha, telefone, cep, cpf, bio)
        VALUES (${nome}, ${email}, ${hashed}, ${telefone || null}, ${cep || null}, ${cpf}, ${bio || null})
        RETURNING id, nome, email, telefone, cep, cpf, bio
      `;
      const userId = userResult[0].id;

      // Insere role
      await sql`
        INSERT INTO role_user (user_id, role) VALUES (${userId}, ${role})
      `;

      return { user: userResult[0], role };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('REGISTER ERROR', err);
    
    // Tratamento de erros de constraint UNIQUE
    if (err.code === '23505') { // unique_violation
      if (err.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email já cadastrado.' });
      }
      if (err.constraint === 'users_cpf_key') {
        return res.status(400).json({ error: 'CPF já cadastrado.' });
      }
      return res.status(400).json({ error: 'Email ou CPF já cadastrado.' });
    }
    
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
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const user = uRes[0];

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

    // Busca roles do usuário
    const roles = await getUserRoles(user.id);

    // Registra login (não bloqueia o fluxo se falhar)
    try {
      await db`
        INSERT INTO record_login (user_id) VALUES (${user.id})
      `;
    } catch (loginRecordErr) {
      console.error('Erro ao registrar login (não crítico):', loginRecordErr);
    }

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
// NOTA: Blacklist em memória não persiste entre reinícios e não funciona em ambientes multi-instância.
// Recomenda-se migrar para Redis ou criar tabela 'revoked_tokens' no DB para produção.
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
  
  // Usa a função revokeToken do middleware
  try {
    revokeToken(token);
    res.json({ message: 'Logout realizado com sucesso. O token foi invalidado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao revogar token.' });
  }
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

// Solicitar recuperação de senha
router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    // Busca usuário por email
    const userResult = await db`
      SELECT id FROM users WHERE email = ${email}
    `;

    // Se usuário existir, gera código de recuperação
    if (userResult.length > 0) {
      const userId = userResult[0].id;
      
      // Gera código de 6 dígitos (000000 a 999999)
      const recoveryCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      try {
        await db`
          INSERT INTO recovery_keys (user_id, recovery_code, expired)
          VALUES (${userId}, ${recoveryCode}, false)
        `;
        
        // Em produção, aqui você enviaria o código por email
        console.log(`Código de recuperação gerado para ${email}: ${recoveryCode}`);
      } catch (insertErr) {
        console.error('Erro ao criar recovery_key:', insertErr);
      }
    }

    // Sempre retorna 200 para não vazar informação sobre existência do email
    res.status(200).json({ message: 'Se o email existir, um código de recuperação foi enviado.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Resetar senha com código de recuperação
router.post('/password/reset', async (req, res) => {
  try {
    const { email, recovery_code, new_password } = req.body;

    if (!email || !recovery_code || !new_password) {
      return res.status(400).json({ error: 'Email, código de recuperação e nova senha são obrigatórios.' });
    }

    // Busca usuário
    const userResult = await db`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      return res.status(400).json({ error: 'Código de recuperação inválido ou expirado.' });
    }

    const userId = userResult[0].id;

    // Busca último código de recuperação não expirado
    const recoveryResult = await db`
      SELECT id, recovery_code, expired
      FROM recovery_keys
      WHERE user_id = ${userId} AND expired = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (recoveryResult.length === 0 || recoveryResult[0].recovery_code !== recovery_code) {
      return res.status(400).json({ error: 'Código de recuperação inválido ou expirado.' });
    }

    const recoveryId = recoveryResult[0].id;

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Transação para atualizar senha e marcar código como expirado
    await db.begin(async sql => {
      // Atualiza senha do usuário
      await sql`
        UPDATE users
        SET senha = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;

      // Marca código de recuperação como expirado
      await sql`
        UPDATE recovery_keys
        SET expired = true
        WHERE id = ${recoveryId}
      `;
    });

    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  router
};