const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - Listar Usuarios

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM usuarios');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Listar Usuario Unico

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST - Criar Usuario

router.post('/', async (req, res) => {
    const { name, email, password, telefone, cidade, estado, cpf } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO usuarios (nome, email, senha, telefone, cidade, estado, cpf) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, password, telefone, cidade, estado, cpf]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar Usuario

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, telefone, cidade, cpf } = req.body;
    try {
        const result = await db.query(
            'UPDATE usuarios SET name = $1, email = $2, password = $3, telefone = $4, cidade = $5 WHERE id = $6 RETURNING *',
            [name, email, password, telefone, cidade, cpf, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar Usuario

router.delete('/:id', async (req, res)  => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;