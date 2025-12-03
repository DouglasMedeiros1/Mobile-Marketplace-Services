const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Roles permitidos conforme ENUM do banco de dados
const ALLOWED_ROLES = ['admin', 'cliente', 'prestador'];

// GET - Listar roles de um usuário específico (admin apenas)
router.get('/:userId/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Verifica se usuário existe
        const userExists = await db`
            SELECT id FROM users WHERE id = ${userId}
        `;
        
        if (userExists.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Busca roles do usuário
        const roles = await db`
            SELECT id, role, user_id FROM role_user WHERE user_id = ${userId}
        `;

        res.status(200).json({
            userId: parseInt(userId),
            roles: roles.map(r => r.role)
        });
    } catch (err) {
        console.error('GET /users/:userId/roles ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST - Adicionar role a um usuário (admin apenas)
router.post('/:userId/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { userId } = req.params;
    let { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Campo role é obrigatório' });
    }

    // Normaliza role para lowercase
    role = role.toLowerCase().trim();

    // Valida se role é permitido
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ 
            error: `Role inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}` 
        });
    }

    try {
        // Transação para verificar usuário e adicionar role
        const result = await db.begin(async sql => {
            // Verifica se usuário existe
            const userExists = await sql`
                SELECT id FROM users WHERE id = ${userId}
            `;
            
            if (userExists.length === 0) {
                throw { status: 404, message: 'Usuário não encontrado' };
            }

            // Verifica se role já existe para este usuário
            const roleExists = await sql`
                SELECT id FROM role_user WHERE user_id = ${userId} AND role = ${role}
            `;

            if (roleExists.length > 0) {
                throw { status: 409, message: `Usuário já possui o role '${role}'` };
            }

            // Adiciona role
            const inserted = await sql`
                INSERT INTO role_user (user_id, role)
                VALUES (${userId}, ${role})
                RETURNING id, user_id, role
            `;

            return inserted[0];
        });

        res.status(201).json({
            message: `Role '${role}' adicionado com sucesso`,
            data: result
        });
    } catch (err) {
        console.error('POST /users/:userId/roles ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 409) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Remover role de um usuário (admin apenas)
router.delete('/:userId/roles/:role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { userId, role } = req.params;
    const normalizedRole = role.toLowerCase().trim();

    // Valida se role é permitido
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ 
            error: `Role inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}` 
        });
    }

    try {
        // Transação para verificar e remover role
        await db.begin(async sql => {
            // Verifica se usuário existe
            const userExists = await sql`
                SELECT id FROM users WHERE id = ${userId}
            `;
            
            if (userExists.length === 0) {
                throw { status: 404, message: 'Usuário não encontrado' };
            }

            // Verifica quantos roles o usuário possui
            const userRoles = await sql`
                SELECT role FROM role_user WHERE user_id = ${userId}
            `;

            // Não permite remover último role (usuário deve ter pelo menos um role)
            if (userRoles.length === 1 && userRoles[0].role === normalizedRole) {
                throw { 
                    status: 400, 
                    message: 'Não é possível remover o último role do usuário. Todo usuário deve ter pelo menos um role.' 
                };
            }

            // Remove role
            const deleted = await sql`
                DELETE FROM role_user 
                WHERE user_id = ${userId} AND role = ${normalizedRole}
                RETURNING id
            `;

            if (deleted.length === 0) {
                throw { status: 404, message: `Usuário não possui o role '${normalizedRole}'` };
            }
        });

        res.status(200).json({ 
            message: `Role '${normalizedRole}' removido com sucesso` 
        });
    } catch (err) {
        console.error('DELETE /users/:userId/roles/:role ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Substituir todos os roles de um usuário (admin apenas)
router.put('/:userId/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { userId } = req.params;
    let { roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ 
            error: 'Campo roles é obrigatório e deve ser um array não vazio' 
        });
    }

    // Normaliza e valida roles
    const normalizedRoles = roles.map(r => r.toLowerCase().trim());
    const uniqueRoles = [...new Set(normalizedRoles)]; // Remove duplicatas

    for (const role of uniqueRoles) {
        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ 
                error: `Role inválido: '${role}'. Valores permitidos: ${ALLOWED_ROLES.join(', ')}` 
            });
        }
    }

    try {
        // Transação para substituir roles
        const result = await db.begin(async sql => {
            // Verifica se usuário existe
            const userExists = await sql`
                SELECT id FROM users WHERE id = ${userId}
            `;
            
            if (userExists.length === 0) {
                throw { status: 404, message: 'Usuário não encontrado' };
            }

            // Remove todos os roles existentes
            await sql`
                DELETE FROM role_user WHERE user_id = ${userId}
            `;

            // Adiciona novos roles
            const insertedRoles = [];
            for (const role of uniqueRoles) {
                const inserted = await sql`
                    INSERT INTO role_user (user_id, role)
                    VALUES (${userId}, ${role})
                    RETURNING id, user_id, role
                `;
                insertedRoles.push(inserted[0]);
            }

            return insertedRoles;
        });

        res.status(200).json({
            message: 'Roles atualizados com sucesso',
            data: {
                userId: parseInt(userId),
                roles: result.map(r => r.role)
            }
        });
    } catch (err) {
        console.error('PUT /users/:userId/roles ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
