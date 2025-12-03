const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  addAvailablePrestador, 
  removeAvailablePrestador 
} = require('../utils/quickServiceStorage');

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
        // Garante que senha nunca seja exposta
        res.status(200).json(result);
    } catch (err) {
        console.error('GET /users/all ERROR:', err);
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
        console.error('GET /users/me ERROR:', err);
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
        console.error('GET /users/:id ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar usuário por ID (próprio usuário ou admin)
router.put('/:id', authenticateToken, async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const requesterId = req.user.id;
    const requesterRoles = req.user.roles || [];

    if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    // Autorização: próprio usuário ou admin
    const isOwnProfile = requesterId === targetUserId;
    const isAdmin = requesterRoles.includes('admin');

    if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode editar seu próprio perfil.' });
    }

    try {
        // Campos permitidos para atualização (não inclui cpf ou senha)
        const { nome, email, telefone, cep, bio } = req.body;

        // Transação para atualizar dados
        const result = await db.begin(async sql => {
            const updated = await sql`
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
            
            if (updated.length === 0) {
                throw { status: 404, message: 'User not found' };
            }
            
            return updated[0];
        });

        res.status(200).json(result);
    } catch (err) {
        console.error('PUT /users/:id ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        
        // Tratamento de erro de UNIQUE constraint (email)
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
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
        console.error('DELETE /users/me ERROR:', err);
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
        console.error('DELETE /users/:id ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Alterar disponibilidade para serviços rápidos
router.put('/me/quick-availability', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { disponivel, lat, lon, categoryIds } = req.body;

        if (typeof disponivel !== 'boolean') {
            return res.status(400).json({ error: 'Campo disponivel é obrigatório (boolean)' });
        }

        // Verificar se usuário é prestador
        const userRoles = await db`
            SELECT role FROM role_user WHERE user_id = ${userId}
        `;
        const isPrestador = userRoles.some(r => r.role === 'prestador');

        if (!isPrestador) {
            return res.status(403).json({ 
                error: 'Apenas prestadores podem ativar disponibilidade para serviços rápidos' 
            });
        }

        // Se ativando disponibilidade, validar campos obrigatórios
        if (disponivel) {
            if (!lat || !lon || !categoryIds || !Array.isArray(categoryIds)) {
                return res.status(400).json({ 
                    error: 'Quando disponivel=true, campos obrigatórios: lat, lon, categoryIds (array)' 
                });
            }

            if (typeof lat !== 'number' || lat < -90 || lat > 90) {
                return res.status(400).json({ error: 'Latitude inválida (deve estar entre -90 e 90)' });
            }

            if (typeof lon !== 'number' || lon < -180 || lon > 180) {
                return res.status(400).json({ error: 'Longitude inválida (deve estar entre -180 e 180)' });
            }

            if (categoryIds.length === 0) {
                return res.status(400).json({ error: 'Pelo menos uma categoria deve ser informada' });
            }

            // Verificar se categorias existem
            const categorias = await db`
                SELECT id FROM categories WHERE id = ANY(${categoryIds})
            `;
            
            if (categorias.length !== categoryIds.length) {
                return res.status(400).json({ error: 'Uma ou mais categorias não existem' });
            }

            // Buscar nome do prestador
            const user = await db`SELECT nome FROM users WHERE id = ${userId}`;
            
            // Adicionar ao JSON de disponíveis (TTL 5 minutos)
            await addAvailablePrestador({
                userId,
                nome: user[0].nome,
                lat,
                lon,
                categoryIds,
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            });
        } else {
            // Remover do JSON
            await removeAvailablePrestador(userId);
        }

        // Atualizar campo no DB
        await db`
            UPDATE users 
            SET disponivel_servico_rapido = ${disponivel}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${userId}
        `;

        res.json({ success: true, disponivel });

    } catch (err) {
        console.error('PUT /users/me/quick-availability ERROR:', err);
        res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
    }
});

module.exports = router;