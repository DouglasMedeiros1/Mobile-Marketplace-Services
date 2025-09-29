const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs'); 
const db = dbModule.default; 

// GET - Listar Usuarios

router.get('/', async (req, res) => {
    try {

        const result = await db`SELECT * FROM usuarios`; 
        res.status(200).json(result); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET - Listar Usuario por ID

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db`SELECT * FROM usuarios WHERE id = ${id}`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]); 
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
        const result = await db`
            INSERT INTO usuarios (nome, email, senha, telefone, cidade, estado, cpf) 
            VALUES (${name}, ${email}, ${password}, ${telefone}, ${cidade}, ${estado}, ${cpf}) 
            RETURNING *`;
        res.status(201).json(result[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar Usuario

router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const { name, email, password, telefone, cidade, estado, cpf } = req.body; 
    try {

        const result = await db`
            UPDATE usuarios SET 
            nome = ${name}, email = ${email}, senha = ${password}, telefone = ${telefone}, cidade = ${cidade}, estado = ${estado}, cpf = ${cpf} 
            WHERE id = ${id} 
            RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar Usuario

router.delete('/:id', async (req, res)  => {
    const { id } = req.params;
    try {
        const result = await db`DELETE FROM usuarios WHERE id = ${id} RETURNING *`;
        if (result.length === 0) {
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