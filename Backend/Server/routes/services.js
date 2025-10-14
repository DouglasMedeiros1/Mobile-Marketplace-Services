const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs'); 
const db = dbModule.default; 

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
router.post('/', async (req, res) => {
    const {
        nome,
        descricao,
        valor_minimo,
        valor_maximo,
        data_inicio,
        data_fim,
        local,
        user_id,
        metodo_pagamento,
        category_id
    } = req.body;

    if (!nome || valor_minimo == null || valor_maximo == null || !data_fim || !user_id || !category_id) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, valor_minimo, valor_maximo, data_fim, user_id, category_id' });
    }

    try {
        const result = await db`
            INSERT INTO services
            (nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, user_id, metodo_pagamento, category_id)
            VALUES (${nome}, ${descricao}, ${valor_minimo}, ${valor_maximo}, ${data_inicio}, ${data_fim}, ${local}, ${user_id}, ${metodo_pagamento}, ${category_id})
            RETURNING *`;
        res.status(201).json(result[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar serviço
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nome,
        descricao,
        valor_minimo,
        valor_maximo,
        data_inicio,
        data_fim,
        local,
        user_id,
        metodo_pagamento,
        category_id
    } = req.body;

    if (!nome || valor_minimo == null || valor_maximo == null || !data_fim || !user_id || !category_id) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, valor_minimo, valor_maximo, data_fim, user_id, category_id' });
    }

    try {
        const result = await db`
            UPDATE services SET
                nome = ${nome},
                descricao = ${descricao},
                valor_minimo = ${valor_minimo},
                valor_maximo = ${valor_maximo},
                data_inicio = ${data_inicio},
                data_fim = ${data_fim},
                local = ${local},
                user_id = ${user_id},
                metodo_pagamento = ${metodo_pagamento},
                category_id = ${category_id},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.status(200).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar serviço
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`DELETE FROM services WHERE id = ${id} RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;