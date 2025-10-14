// middleware/auth.js
const jwt = require('jsonwebtoken');

// Blacklist de tokens (importada do módulo de rotas)
const { tokenBlacklist } = require('../routes/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Token malformado' });

  // Verifica se o token está na blacklist
  if (tokenBlacklist && tokenBlacklist.includes(token)) {
    return res.status(401).json({ error: 'Token revogado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload deve conter: { userId, roles }
    req.user = {
      id: payload.userId,
      roles: payload.roles || []
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware para autorização por role
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    // Se o usuário possuir pelo menos um dos roles permitidos
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};