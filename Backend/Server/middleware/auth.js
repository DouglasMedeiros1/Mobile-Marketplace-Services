// middleware/auth.js
/**
 * Middleware de autenticação e autorização JWT
 * 
 * IMPORTANTE - Blacklist de tokens:
 * - A blacklist de tokens revogados é mantida em memória (Set).
 * - Esta abordagem NÃO persiste entre reinícios do servidor.
 * - Para ambientes de produção ou multi-instância, recomenda-se:
 *   1. Armazenar tokens revogados no banco de dados (tabela revoked_tokens)
 *   2. Usar Redis para cache distribuído de tokens revogados
 *   3. Implementar TTL automático baseado na expiração do token
 * 
 * Dependências: jsonwebtoken
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Set para armazenar tokens revogados em memória
const revokedTokens = new Set();

/**
 * Adiciona um token à blacklist de tokens revogados
 * @param {string} token - Token JWT a ser revogado
 */
function revokeToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido para revogação');
  }
  revokedTokens.add(token);
}

/**
 * Verifica se um token está revogado
 * @param {string} token - Token JWT a ser verificado
 * @returns {boolean} true se o token está revogado, false caso contrário
 */
function isTokenRevoked(token) {
  return revokedTokens.has(token);
}

/**
 * Middleware de autenticação JWT
 * Valida o token JWT, verifica se está revogado e popula req.user
 * 
 * @param {Object} req - Request object do Express
 * @param {Object} res - Response object do Express
 * @param {Function} next - Next middleware function
 * 
 * Popula req.user com:
 * - id: ID do usuário (extraído de payload.userId, payload.user_id ou payload.id)
 * - roles: Array de roles do usuário (extraído de payload.roles, default: [])
 * 
 * Retorna 401 em caso de:
 * - Header Authorization ausente
 * - Token malformado (não segue padrão "Bearer <token>")
 * - Token revogado (presente na blacklist)
 * - Token inválido ou expirado (falha na verificação JWT)
 * 
 * Exemplo de uso:
 * router.get('/users/me', authenticate, (req, res) => {
 *   const userId = req.user.id;
 *   const userRoles = req.user.roles;
 *   // ... lógica da rota
 * });
 */
function authenticate(req, res, next) {
  // 1. Verifica presença do header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido. Header Authorization é obrigatório.' });
  }

  // 2. Valida formato "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Formato de token inválido. Use: Bearer <token>' });
  }

  const [scheme, token] = parts;
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato de token inválido. Esquema deve ser Bearer.' });
  }

  // 3. Verifica se o token está revogado
  if (isTokenRevoked(token)) {
    return res.status(401).json({ error: 'Token revogado. Faça login novamente.' });
  }

  // 4. Verifica e decodifica o token JWT
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // 5. Extrai userId (suporta múltiplos formatos de payload)
    const userId = payload.userId || payload.user_id || payload.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token inválido: userId não encontrado no payload.' });
    }

    // 6. Popula req.user com id e roles
    req.user = {
      id: userId,
      roles: payload.roles || []
    };

    next();
  } catch (err) {
    // Erros comuns do jwt.verify:
    // - TokenExpiredError: token expirado
    // - JsonWebTokenError: token malformado ou assinatura inválida
    // - NotBeforeError: token usado antes do tempo permitido
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    return res.status(401).json({ error: 'Falha na autenticação do token.' });
  }
}

/**
 * Factory middleware para exigir roles específicos
 * Retorna um handler que valida se o usuário possui pelo menos um dos roles permitidos
 * 
 * @param {...string} allowedRoles - Um ou mais roles permitidos (ex: 'admin', 'cliente', 'prestador')
 * @returns {Function} Express middleware function (req, res, next)
 * 
 * DEPENDÊNCIA OBRIGATÓRIA:
 * - Este middleware DEVE ser usado APÓS o middleware `authenticate`
 * - O middleware `authenticate` popula req.user com { id, roles }
 * - Se usado sem autenticação prévia, retornará 401
 * 
 * Comportamento:
 * 1. Se req.user ausente -> retorna 401 (não autenticado)
 * 2. Se req.user.roles contém qualquer allowedRole -> chama next()
 * 3. Caso contrário -> retorna 403 (permissão negada)
 * 
 * Roles válidos (conforme enum do banco):
 * - 'admin': administrador do sistema
 * - 'cliente': usuário que solicita serviços
 * - 'prestador': usuário que oferece serviços
 * 
 * @example
 * // Apenas administradores
 * router.delete('/users/:id', authenticate, requireRole('admin'), (req, res) => {
 *   // Código executado apenas se usuário for admin
 * });
 * 
 * @example
 * // Administradores OU prestadores
 * router.post('/services', authenticate, requireRole('admin', 'prestador'), (req, res) => {
 *   // Código executado se usuário for admin OU prestador
 * });
 * 
 * @example
 * // Todos os tipos de usuários autenticados
 * router.get('/categories', authenticate, requireRole('admin', 'cliente', 'prestador'), (req, res) => {
 *   // Qualquer usuário autenticado pode acessar
 * });
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // 1. Verifica se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado. Este endpoint requer autenticação prévia.' 
      });
    }

    // 2. Verifica se roles existem no objeto user
    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return res.status(401).json({ 
        error: 'Dados de autenticação inválidos. Roles não encontrados.' 
      });
    }

    // 3. Verifica se usuário possui pelo menos um dos roles permitidos
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Permissão negada. Roles necessários: ' + allowedRoles.join(', ') + '.' 
      });
    }

    // 4. Usuário autorizado, prossegue para próximo middleware
    next();
  };
}

/**
 * Middleware de autorização por roles (alias para compatibilidade)
 * Verifica se o usuário autenticado possui pelo menos um dos roles permitidos
 * 
 * @param {...string} allowedRoles - Roles permitidos para acessar a rota
 * @returns {Function} Middleware function
 * 
 * IMPORTANTE: Este middleware deve ser usado APÓS o middleware authenticate
 * 
 * Retorna 403 se:
 * - req.user não existe (usuário não autenticado)
 * - req.user.roles não existe ou está vazio
 * - Usuário não possui nenhum dos roles permitidos
 * 
 * Exemplo de uso:
 * router.delete('/users/:id', authenticate, authorizeRoles('admin'), (req, res) => {
 *   // Apenas usuários com role 'admin' podem acessar
 * });
 * 
 * router.post('/services', authenticate, authorizeRoles('prestador', 'admin'), (req, res) => {
 *   // Usuários com role 'prestador' OU 'admin' podem acessar
 * });
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Acesso negado. Usuário não autenticado.' });
    }

    // Verifica se o usuário possui pelo menos um dos roles permitidos
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Permissão insuficiente. Roles necessários: ' + allowedRoles.join(', ') 
      });
    }

    next();
  };
}

// Mantém compatibilidade com código existente que importa authenticateToken
const authenticateToken = authenticate;

module.exports = {
  authenticate,
  authenticateToken, // alias para compatibilidade retroativa
  requireRole,       // factory middleware principal para validação de roles
  authorizeRoles,    // alias alternativo para requireRole
  revokeToken,
  isTokenRevoked,
  revokedTokens // exportado para uso em rotas (ex: logout)
};