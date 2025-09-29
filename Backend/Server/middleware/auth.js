// middleware/auth.js
const jwt = require('jsonwebtoken');

// 🌟 Importa a blacklist diretamente do módulo de rotas (routes/auth.js)
// Este é o método mais simples para projetos pequenos.
const { tokenBlacklist } = require('../routes/auth'); 

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token inválido' });

  const scheme = parts[0];
  const token = parts[1];

  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformado' });

  // 🌟 VERIFICAÇÃO DE BLACKLIST
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ error: 'Token inválido (revogado)' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};