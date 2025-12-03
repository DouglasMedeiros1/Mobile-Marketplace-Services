const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - Listar todas as categorias
router.get('/', async (req, res) => {
    try {
        const result = await db`SELECT * FROM categories ORDER BY nome`;
        res.status(200).json(result);
    } catch (err) {
        console.error('GET /categories ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Obter categoria por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`SELECT * FROM categories WHERE id = ${id}`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        res.status(200).json(result[0]);
    } catch (err) {
        console.error('GET /categories/:id ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
