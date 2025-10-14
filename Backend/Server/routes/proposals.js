const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET - Listar todas as propostas de um serviço
router.get('/service/:serviceId', authenticateToken, async (req, res) => {
    const { serviceId } = req.params;
    try {
        const result = await db`
            SELECT p.*, u.nome AS prestador_nome, u.email AS prestador_email
            FROM proposals p
            JOIN users u ON p.prestador_id = u.id
            WHERE p.service_id = ${serviceId}
            ORDER BY p.id
        `;
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Listar todas as propostas feitas pelo usuário autenticado (prestador)
router.get('/my', authenticateToken, authorizeRoles('prestador'), async (req, res) => {
    try {
        const result = await db`
            SELECT p.*, s.nome AS servico_nome
            FROM proposals p
            JOIN services s ON p.service_id = s.id
            WHERE p.prestador_id = ${req.user.id}
            ORDER BY p.id
        `;
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST - Criar proposta (apenas prestador pode criar)
router.post('/', authenticateToken, authorizeRoles('prestador'), async (req, res) => {
    const { service_id, valor, mensagem } = req.body;
    const prestador_id = req.user.id;

    if (!service_id || valor == null) {
        return res.status(400).json({ error: 'Campos obrigatórios: service_id, valor' });
    }

    try {
        // Impede propostas duplicadas do mesmo prestador para o mesmo serviço
        const exists = await db`
            SELECT 1 FROM proposals WHERE service_id = ${service_id} AND prestador_id = ${prestador_id}
        `;
        if (exists.length > 0) {
            return res.status(409).json({ error: 'Proposta já enviada para este serviço' });
        }

        const result = await db`
            INSERT INTO proposals (service_id, prestador_id, valor, mensagem)
            VALUES (${service_id}, ${prestador_id}, ${valor}, ${mensagem})
            RETURNING *
        `;
        res.status(201).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar proposta (apenas prestador dono pode atualizar valor/mensagem)
router.put('/:id', authenticateToken, authorizeRoles('prestador'), async (req, res) => {
    const { id } = req.params;
    const { valor, mensagem } = req.body;
    const prestador_id = req.user.id;

    try {
        // Verifica se a proposta pertence ao prestador autenticado
        const proposal = await db`
            SELECT * FROM proposals WHERE id = ${id} AND prestador_id = ${prestador_id}
        `;
        if (proposal.length === 0) {
            return res.status(404).json({ error: 'Proposta não encontrada ou acesso negado' });
        }

        const result = await db`
            UPDATE proposals SET
                valor = COALESCE(${valor}, valor),
                mensagem = COALESCE(${mensagem}, mensagem),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH - Atualizar apenas o status da proposta (apenas admin ou cliente do serviço pode mudar)
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'cliente'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Campo status é obrigatório' });
    }

    try {
        // Busca a proposta e o serviço relacionado
        const proposal = await db`
            SELECT p.*, s.user_id AS cliente_id
            FROM proposals p
            JOIN services s ON p.service_id = s.id
            WHERE p.id = ${id}
        `;
        if (proposal.length === 0) {
            return res.status(404).json({ error: 'Proposta não encontrada' });
        }
        // Apenas admin ou o cliente dono do serviço pode alterar o status
        if (
            !req.user.roles.includes('admin') &&
            !(req.user.roles.includes('cliente') && req.user.id === proposal[0].cliente_id)
        ) {
            return res.status(403).json({ error: 'Permissão insuficiente' });
        }

        const result = await db`
            UPDATE proposals SET
                status = ${status},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Excluir proposta (apenas prestador dono pode excluir)
router.delete('/:id', authenticateToken, authorizeRoles('prestador'), async (req, res) => {
    const { id } = req.params;
    const prestador_id = req.user.id;

    try {
        const result = await db`
            DELETE FROM proposals WHERE id = ${id} AND prestador_id = ${prestador_id}
            RETURNING *
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Proposta não encontrada ou acesso negado' });
        }
        res.status(200).json({ message: 'Proposta deletada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;