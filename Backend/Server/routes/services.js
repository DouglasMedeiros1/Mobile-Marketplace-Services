const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { authenticateToken } = require('../middleware/auth'); 

// GET - Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        const result = await db`SELECT * FROM services ORDER BY id`;
        res.status(200).json(result); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Obter serviço por id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`SELECT * FROM services WHERE id = ${id}`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        res.status(200).json(result[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST - Criar serviço
router.post('/', authenticateToken, async (req, res) => {
    const {
        nome,
        descricao,
        valor_minimo,
        valor_maximo,
        data_inicio,
        data_fim,
        local,
        metodo_pagamento,
        category_id
    } = req.body;

    // Deriva user_id do token (ignora qualquer user_id do body por segurança)
    const user_id = req.user.id;

    // Validações
    if (!nome) {
        return res.status(400).json({ error: 'Campo obrigatório: nome' });
    }
    if (!category_id) {
        return res.status(400).json({ error: 'Campo obrigatório: category_id' });
    }
    if (!data_fim) {
        return res.status(400).json({ error: 'Campo obrigatório: data_fim' });
    }
    if (valor_minimo == null || valor_maximo == null) {
        return res.status(400).json({ error: 'Campos obrigatórios: valor_minimo e valor_maximo' });
    }
    if (valor_minimo <= 0 || valor_maximo <= 0) {
        return res.status(400).json({ error: 'Valores devem ser maiores que zero' });
    }
    if (valor_minimo > valor_maximo) {
        return res.status(400).json({ error: 'valor_minimo deve ser menor ou igual a valor_maximo' });
    }

    try {
        // Transação para criar serviço
        const result = await db.begin(async sql => {
            const serviceResult = await sql`
                INSERT INTO services
                (nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, user_id, metodo_pagamento, category_id)
                VALUES (${nome}, ${descricao}, ${valor_minimo}, ${valor_maximo}, ${data_inicio}, ${data_fim}, ${local}, ${user_id}, ${metodo_pagamento}, ${category_id})
                RETURNING *`;
            return serviceResult[0];
        });
        res.status(201).json(result); 
    } catch (err) {
        console.error('POST /services ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar serviço
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        nome,
        descricao,
        valor_minimo,
        valor_maximo,
        data_inicio,
        data_fim,
        local,
        metodo_pagamento,
        category_id
    } = req.body;

    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Validações (se campos forem fornecidos)
    if (valor_minimo != null && valor_minimo <= 0) {
        return res.status(400).json({ error: 'valor_minimo deve ser maior que zero' });
    }
    if (valor_maximo != null && valor_maximo <= 0) {
        return res.status(400).json({ error: 'valor_maximo deve ser maior que zero' });
    }
    if (valor_minimo != null && valor_maximo != null && valor_minimo > valor_maximo) {
        return res.status(400).json({ error: 'valor_minimo deve ser menor ou igual a valor_maximo' });
    }

    try {
        // Transação para verificar permissão e atualizar
        const result = await db.begin(async sql => {
            // Busca serviço existente
            const existing = await sql`
                SELECT user_id FROM services WHERE id = ${id}
            `;

            if (existing.length === 0) {
                throw { status: 404, message: 'Serviço não encontrado' };
            }

            // Verifica autorização: owner ou admin
            const isOwner = existing[0].user_id === userId;
            const isAdmin = userRoles.includes('admin');

            if (!isOwner && !isAdmin) {
                throw { status: 403, message: 'Acesso negado. Apenas o criador ou admin pode atualizar este serviço.' };
            }

            // Atualiza serviço (COALESCE mantém valores antigos se não fornecidos)
            const updated = await sql`
                UPDATE services SET
                    nome = COALESCE(${nome}, nome),
                    descricao = COALESCE(${descricao}, descricao),
                    valor_minimo = COALESCE(${valor_minimo}, valor_minimo),
                    valor_maximo = COALESCE(${valor_maximo}, valor_maximo),
                    data_inicio = COALESCE(${data_inicio}, data_inicio),
                    data_fim = COALESCE(${data_fim}, data_fim),
                    local = COALESCE(${local}, local),
                    metodo_pagamento = COALESCE(${metodo_pagamento}, metodo_pagamento),
                    category_id = COALESCE(${category_id}, category_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *`;

            return updated[0];
        });

        res.status(200).json(result);
    } catch (err) {
        console.error('PUT /services/:id ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar serviço
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    try {
        // Transação para verificar permissão e deletar
        await db.begin(async sql => {
            // Busca serviço existente
            const existing = await sql`
                SELECT user_id FROM services WHERE id = ${id}
            `;

            if (existing.length === 0) {
                throw { status: 404, message: 'Serviço não encontrado' };
            }

            // Verifica autorização: owner ou admin
            const isOwner = existing[0].user_id === userId;
            const isAdmin = userRoles.includes('admin');

            if (!isOwner && !isAdmin) {
                throw { status: 403, message: 'Acesso negado. Apenas o criador ou admin pode deletar este serviço.' };
            }

            // Deleta serviço (CASCADE deletará proposals relacionadas)
            await sql`DELETE FROM services WHERE id = ${id}`;
        });

        res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        console.error('DELETE /services/:id ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;