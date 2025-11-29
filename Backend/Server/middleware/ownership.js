// middleware/ownership.js
/**
 * Middleware de validação de propriedade de recursos
 * 
 * Este middleware garante que apenas o dono de um recurso ou administradores
 * possam acessar/modificar determinados endpoints.
 * 
 * DEPENDÊNCIAS:
 * - Banco de dados Postgres via módulo '../db.mjs' (postgres library)
 * - Middleware `authenticate` DEVE ser executado antes deste middleware
 * - req.user deve estar populado com { id, roles }
 * 
 * Casos de uso:
 * - Proteger edição de serviços (apenas criador ou admin)
 * - Proteger deleção de propostas (apenas autor ou admin)
 * - Proteger atualização de perfil (apenas próprio usuário ou admin)
 */

const dbModule = require('../db.mjs');
const db = dbModule.default;

/**
 * Factory middleware que valida propriedade de recurso OU role admin
 * 
 * @param {Object} options - Configurações do middleware
 * @param {string} options.table - Nome da tabela no banco de dados
 * @param {string} [options.idParam='id'] - Nome do parâmetro da rota que contém o ID do recurso
 * @param {string} [options.ownerColumn='user_id'] - Nome da coluna que armazena o ID do dono do recurso
 * @returns {Function} Express middleware function (req, res, next)
 * 
 * COMPORTAMENTO:
 * 1. Extrai o ID do recurso de req.params[idParam]
 * 2. Consulta o banco de dados para obter o dono do recurso
 * 3. Se recurso não existir -> retorna 404
 * 4. Se req.user.id === owner OU req.user.roles inclui 'admin' -> next()
 * 5. Caso contrário -> retorna 403
 * 
 * IMPORTANTE:
 * - Este middleware assume que o usuário já foi autenticado (req.user existe)
 * - Se req.user não existir, retorna 401
 * - Erros de banco de dados são logados e retornam 500
 * 
 * @example
 * // Proteger edição de serviço (apenas criador ou admin)
 * router.put('/services/:id', 
 *   authenticate, 
 *   ensureOwnerOrAdmin({ table: 'services', idParam: 'id', ownerColumn: 'user_id' }),
 *   async (req, res) => {
 *     // Apenas dono ou admin chegam aqui
 *     // ... lógica de atualização
 *   }
 * );
 * 
 * @example
 * // Proteger deleção de proposta (apenas autor ou admin)
 * router.delete('/proposals/:proposalId', 
 *   authenticate, 
 *   ensureOwnerOrAdmin({ 
 *     table: 'proposals', 
 *     idParam: 'proposalId', 
 *     ownerColumn: 'prestador_id' 
 *   }),
 *   async (req, res) => {
 *     // ... lógica de deleção
 *   }
 * );
 * 
 * @example
 * // Proteger atualização de perfil de usuário (apenas próprio ou admin)
 * router.put('/users/:userId', 
 *   authenticate, 
 *   ensureOwnerOrAdmin({ 
 *     table: 'users', 
 *     idParam: 'userId', 
 *     ownerColumn: 'id' // o próprio ID é o dono
 *   }),
 *   async (req, res) => {
 *     // Apenas o próprio usuário ou admin podem atualizar
 *   }
 * );
 */
function ensureOwnerOrAdmin({ table, idParam = 'id', ownerColumn = 'user_id' }) {
  // Validação dos parâmetros da factory
  if (!table || typeof table !== 'string') {
    throw new Error('ensureOwnerOrAdmin: parâmetro "table" é obrigatório e deve ser string');
  }
  if (!idParam || typeof idParam !== 'string') {
    throw new Error('ensureOwnerOrAdmin: parâmetro "idParam" deve ser string');
  }
  if (!ownerColumn || typeof ownerColumn !== 'string') {
    throw new Error('ensureOwnerOrAdmin: parâmetro "ownerColumn" deve ser string');
  }

  // Retorna o middleware configurado
  return async (req, res, next) => {
    try {
      // 1. Verifica se usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          error: 'Não autenticado. Este endpoint requer autenticação prévia.' 
        });
      }

      // 2. Extrai o ID do recurso dos parâmetros da rota
      const resourceId = req.params[idParam];
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: `Parâmetro '${idParam}' não encontrado na URL.` 
        });
      }

      // Converte para número (IDs são tipicamente INTEGER no banco)
      const resourceIdNum = parseInt(resourceId, 10);
      if (isNaN(resourceIdNum)) {
        return res.status(400).json({ 
          error: `Parâmetro '${idParam}' deve ser um número válido.` 
        });
      }

      // 3. Consulta o banco de dados para obter o dono do recurso
      // Usa template literal do postgres para query segura
      let result;
      
      try {
        // Query dinâmica usando postgres library
        // IMPORTANTE: Não podemos usar interpolação direta para nomes de tabelas/colunas
        // no postgres library, então usamos sql.unsafe ou construímos a query manualmente
        result = await db.unsafe(
          `SELECT ${ownerColumn} FROM ${table} WHERE id = $1 LIMIT 1`,
          [resourceIdNum]
        );
      } catch (dbError) {
        console.error(`[ensureOwnerOrAdmin] Erro ao consultar ${table}:`, dbError);
        return res.status(500).json({ 
          error: 'Erro ao verificar propriedade do recurso.' 
        });
      }

      // 4. Verifica se o recurso existe
      if (result.length === 0) {
        return res.status(404).json({ 
          error: `Recurso não encontrado na tabela '${table}' com ID ${resourceIdNum}.` 
        });
      }

      const resource = result[0];
      const ownerId = resource[ownerColumn];

      // 5. Verifica se o usuário é o dono OU é admin
      const isOwner = req.user.id === ownerId;
      const isAdmin = req.user.roles && req.user.roles.includes('admin');

      if (isOwner || isAdmin) {
        // Usuário autorizado - pode ser útil para logging
        console.log(`[ensureOwnerOrAdmin] Acesso permitido ao ${table}#${resourceIdNum} - ` +
          `Usuário: ${req.user.id} (${isOwner ? 'dono' : 'admin'})`);
        
        // Opcional: anexa informação do recurso ao req para uso posterior
        req.resourceOwner = ownerId;
        
        return next();
      }

      // 6. Usuário não é dono nem admin - acesso negado
      return res.status(403).json({ 
        error: 'Permissão negada. Você não tem autorização para acessar este recurso.',
        details: 'Apenas o proprietário do recurso ou administradores podem realizar esta ação.'
      });

    } catch (err) {
      // Erro inesperado no middleware
      console.error('[ensureOwnerOrAdmin] Erro inesperado:', err);
      return res.status(500).json({ 
        error: 'Erro interno ao processar a requisição.' 
      });
    }
  };
}

/**
 * Middleware simplificado para validar se usuário é dono do próprio perfil OU admin
 * Atalho comum para rotas de usuário como PUT /users/:id
 * 
 * @param {string} [idParam='id'] - Nome do parâmetro que contém o ID do usuário
 * @returns {Function} Express middleware
 * 
 * @example
 * router.put('/users/:id', authenticate, ensureOwnProfileOrAdmin(), async (req, res) => {
 *   // Apenas o próprio usuário ou admin podem atualizar
 * });
 */
function ensureOwnProfileOrAdmin(idParam = 'id') {
  return ensureOwnerOrAdmin({ 
    table: 'users', 
    idParam, 
    ownerColumn: 'id' 
  });
}

/**
 * Middleware para validar propriedade de serviço OU admin
 * Atalho para rotas de serviços como PUT/DELETE /services/:id
 * 
 * @param {string} [idParam='id'] - Nome do parâmetro que contém o ID do serviço
 * @returns {Function} Express middleware
 * 
 * @example
 * router.put('/services/:id', authenticate, ensureServiceOwnerOrAdmin(), updateService);
 * router.delete('/services/:id', authenticate, ensureServiceOwnerOrAdmin(), deleteService);
 */
function ensureServiceOwnerOrAdmin(idParam = 'id') {
  return ensureOwnerOrAdmin({ 
    table: 'services', 
    idParam, 
    ownerColumn: 'user_id' 
  });
}

/**
 * Middleware para validar propriedade de proposta OU admin
 * Atalho para rotas de propostas como PUT/DELETE /proposals/:id
 * 
 * @param {string} [idParam='id'] - Nome do parâmetro que contém o ID da proposta
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/proposals/:id', authenticate, ensureProposalOwnerOrAdmin(), deleteProposal);
 */
function ensureProposalOwnerOrAdmin(idParam = 'id') {
  return ensureOwnerOrAdmin({ 
    table: 'proposals', 
    idParam, 
    ownerColumn: 'prestador_id' 
  });
}

module.exports = {
  ensureOwnerOrAdmin,           // Factory principal
  ensureOwnProfileOrAdmin,      // Atalho para perfis de usuário
  ensureServiceOwnerOrAdmin,    // Atalho para serviços
  ensureProposalOwnerOrAdmin    // Atalho para propostas
};
