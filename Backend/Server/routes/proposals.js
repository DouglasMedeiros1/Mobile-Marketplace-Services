const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Status permitidos para propostas
const ALLOWED_PROPOSAL_STATUS = ['aberto', 'aceito', 'recusado', 'cancelado'];

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
        // Normaliza status para lowercase e trim
        const normalized = result.map(prop => ({
            ...prop,
            status: prop.status ? prop.status.toLowerCase().trim() : 'aberto'
        }));
        res.status(200).json(normalized);
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
        // Normaliza status para lowercase e trim
        const normalized = result.map(prop => ({
            ...prop,
            status: prop.status ? prop.status.toLowerCase().trim() : 'aberto'
        }));
        res.status(200).json(normalized);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST - Criar proposta (apenas prestador pode criar)
router.post('/', authenticateToken, authorizeRoles('prestador'), async (req, res) => {
    const { service_id, valor, mensagem } = req.body;
    const prestador_id = req.user.id;
    // Status sempre começa como 'aberto', ignorando qualquer valor do body
    const status = 'aberto';

    if (!service_id || valor == null) {
        return res.status(400).json({ error: 'Campos obrigatórios: service_id, valor' });
    }

    if (valor <= 0) {
        return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    try {
        // Transação para verificar duplicata e inserir
        const result = await db.begin(async sql => {
            // Impede propostas duplicadas do mesmo prestador para o mesmo serviço
            const exists = await sql`
                SELECT 1 FROM proposals WHERE service_id = ${service_id} AND prestador_id = ${prestador_id}
            `;
            if (exists.length > 0) {
                throw { status: 409, message: 'Proposta já enviada para este serviço' };
            }

            const insertResult = await sql`
                INSERT INTO proposals (service_id, prestador_id, valor, mensagem, status)
                VALUES (${service_id}, ${prestador_id}, ${valor}, ${mensagem}, ${status})
                RETURNING *
            `;
            return insertResult[0];
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('POST /proposals ERROR:', err);
        
        if (err.status === 409) {
            return res.status(409).json({ error: err.message });
        }
        
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

// PATCH - Atualizar apenas o status da proposta
router.patch('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Campo status é obrigatório' });
    }

    // Normaliza entrada: lowercase e trim
    status = status.toLowerCase().trim();

    // Valida contra status permitidos
    if (!ALLOWED_PROPOSAL_STATUS.includes(status)) {
        return res.status(400).json({ 
            error: `Status inválido. Valores permitidos: ${ALLOWED_PROPOSAL_STATUS.join(', ')}` 
        });
    }

    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    try {
        // Transação para verificar permissão e atualizar
        const result = await db.begin(async sql => {
            // Busca a proposta e o serviço relacionado
            const proposal = await sql`
                SELECT p.*, s.user_id AS cliente_id, p.prestador_id
                FROM proposals p
                JOIN services s ON p.service_id = s.id
                WHERE p.id = ${id}
            `;
            
            if (proposal.length === 0) {
                throw { status: 404, message: 'Proposta não encontrada' };
            }

            const isAdmin = userRoles.includes('admin');
            const isCliente = proposal[0].cliente_id === userId;
            const isPrestador = proposal[0].prestador_id === userId;

            // Regras de autorização por status
            if (status === 'aceito' || status === 'cancelado') {
                // Apenas cliente dono do serviço ou admin podem aceitar/cancelar
                if (!isAdmin && !isCliente) {
                    throw { 
                        status: 403, 
                        message: 'Apenas o cliente dono do serviço ou admin podem marcar como aceito/cancelado' 
                    };
                }
            } else if (status === 'recusado') {
                // Prestador pode recusar sua própria proposta, ou cliente/admin também podem
                if (!isAdmin && !isCliente && !isPrestador) {
                    throw { status: 403, message: 'Permissão insuficiente para recusar esta proposta' };
                }
            }

            // Atualiza status
            const updated = await sql`
                UPDATE proposals SET
                    status = ${status},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;

            return updated[0];
        });

        res.status(200).json(result);
    } catch (err) {
        console.error('PATCH /proposals/:id/status ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        
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