const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET - Listar todos os usuários (apenas admin)
router.get('/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await db`
            SELECT u.id, u.nome, u.email, u.telefone, u.cep, u.cpf, u.rating, u.bio, u.created_at, u.updated_at,
                   array_agg(ru.role) AS roles
            FROM users u
            LEFT JOIN role_user ru ON u.id = ru.user_id
            GROUP BY u.id
            ORDER BY u.id
        `;
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Listar usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db`
            SELECT u.id, u.nome, u.email, u.telefone, u.cep, u.cpf, u.rating, u.bio, u.created_at, u.updated_at,
                   array_agg(ru.role) AS roles
            FROM users u
            LEFT JOIN role_user ru ON u.id = ru.user_id
            WHERE u.id = ${userId}
            GROUP BY u.id
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Listar usuário por ID (apenas admin)
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`
            SELECT u.id, u.nome, u.email, u.telefone, u.cep, u.cpf, u.rating, u.bio, u.created_at, u.updated_at,
                   array_agg(ru.role) AS roles
            FROM users u
            LEFT JOIN role_user ru ON u.id = ru.user_id
            WHERE u.id = ${id}
            GROUP BY u.id
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Função auxiliar para buscar roles de um usuário
async function getUserRoles(userId) {
    const roles = await db`SELECT role FROM role_user WHERE user_id = ${userId}`;
    return roles.map(r => r.role);
}

// Função auxiliar para buscar empresas de um usuário (funcionário/supervisor)
async function getUserCompanies(userId) {
    const companies = await db`SELECT company_id, company_role FROM company_user WHERE user_id = ${userId}`;
    return companies;
}

// PUT - Atualizar usuário por ID (admin, supervisor, ou conforme regras)
router.put('/:id', authenticateToken, async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const requesterId = req.user.id;

    if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        // Busca roles dos envolvidos
        const requesterRoles = await getUserRoles(requesterId);
        const targetRoles = await getUserRoles(targetUserId);

        // Busca empresas dos envolvidos (se necessário)
        const requesterCompanies = await getUserCompanies(requesterId);
        const targetCompanies = await getUserCompanies(targetUserId);

        // Regra 1: cliente/prestador pode alterar seus próprios dados ou admin pode alterar qualquer um
        if (
            (targetRoles.includes('cliente') || targetRoles.includes('prestador')) &&
            (requesterId === targetUserId || requesterRoles.includes('admin'))
        ) {
            // permitido
        }
        // Regra 2: funcionário só pode ser alterado por supervisor da mesma empresa ou admin
        else if (
            targetRoles.includes('funcionario') &&
            (
                requesterRoles.includes('admin') ||
                (
                    requesterRoles.includes('supervisor') &&
                    requesterCompanies.some(rc =>
                        rc.company_role === 'supervisor' &&
                        targetCompanies.some(tc => tc.company_id === rc.company_id)
                    )
                )
            )
        ) {
            // permitido
        }
        // Regra 3: supervisor pode alterar seus próprios dados ou admin pode alterar supervisor
        else if (
            targetRoles.includes('supervisor') &&
            (requesterId === targetUserId || requesterRoles.includes('admin'))
        ) {
            // permitido
        }
        // Regra 4: admin pode alterar qualquer admin
        else if (
            targetRoles.includes('admin') &&
            requesterRoles.includes('admin')
        ) {
            // permitido
        }
        else {
            return res.status(403).json({ error: 'Acesso negado para alterar este usuário.' });
        }

        // Atualização dos dados
        const { nome, email, telefone, cep, bio } = req.body;
        const result = await db`
            UPDATE users SET 
                nome = COALESCE(${nome}, nome),
                email = COALESCE(${email}, email),
                telefone = COALESCE(${telefone}, telefone),
                cep = COALESCE(${cep}, cep),
                bio = COALESCE(${bio}, bio),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${targetUserId}
            RETURNING id, nome, email, telefone, cep, cpf, rating, bio, created_at, updated_at
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar usuário autenticado (mantém para compatibilidade, mas usa a mesma lógica)
router.put('/me', authenticateToken, async (req, res) => {
    req.params.id = req.user.id;
    return router.handle(req, res);
});

// DELETE - Deletar usuário autenticado
router.delete('/me', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db`
            DELETE FROM users WHERE id = ${userId} RETURNING id
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar usuário por ID (apenas admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`
            DELETE FROM users WHERE id = ${id} RETURNING id
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;