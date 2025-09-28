const express = require('express');
const router = express.Router();
const db = require('../db.mjs');

// GET - Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM servicos ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Obter serviço por id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM servicos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        res.status(200).json(result.rows[0]);
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
        usuario_id,
        metodo_pagamento,
        categoria_id
    } = req.body;

    // validação básica de campos obrigatórios
    if (!nome || valor_minimo == null || valor_maximo == null || !data_inicio || !usuario_id || !categoria_id) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, valor_minimo, valor_maximo, data_inicio, usuario_id, categoria_id' });
    }

    try {
        const result = await db.query(
            `INSERT INTO servicos
            (nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, usuario_id, metodo_pagamento, categoria_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`,
            [nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, usuario_id, metodo_pagamento, categoria_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar serviço (substitui os campos informados)
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
        usuario_id,
        metodo_pagamento,
        categoria_id
    } = req.body;

    // validação básica (opcional: exigir alguns campos)
    if (!nome || valor_minimo == null || valor_maximo == null || !data_inicio || !usuario_id || !categoria_id) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, valor_minimo, valor_maximo, data_inicio, usuario_id, categoria_id' });
    }

    try {
        const result = await db.query(
            `UPDATE servicos SET
                nome = $1,
                descricao = $2,
                valor_minimo = $3,
                valor_maximo = $4,
                data_inicio = $5,
                data_fim = $6,
                local = $7,
                usuario_id = $8,
                metodo_pagamento = $9,
                categoria_id = $10,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING *`,
            [nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, usuario_id, metodo_pagamento, categoria_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar serviço
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM servicos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
