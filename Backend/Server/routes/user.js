import express from 'express';
import pool from '../db.js'; // pool from pg
const router = express.Router();

// ---------- Usuários (clientes) ----------

// POST /usuarios -> Criar usuário com role 'cliente'
router.post('/usuarios', async (req, res) => {
    const nome = req.body.nome ?? req.body.name;
    const email = req.body.email;
    const senha = req.body.senha ?? req.body.password;
    const telefone = req.body.telefone ?? req.body.phone;

    if (!nome || !email || !senha) {
        console.log('POST /usuarios - missing fields');
        return res.status(400).json({ error: 'nome, email and senha are required' });
    }

    try {
        const query = `
            INSERT INTO usuarios (nome, email, senha, telefone, role)
            VALUES ($1, $2, $3, $4, 'cliente')
            RETURNING id, nome, email, telefone, role, created_at, updated_at
        `;
        const { rows } = await pool.query(query, [nome, email, senha, telefone]);
        console.log('User created:', rows[0].id);
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /usuarios error', err);
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Email already in use' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /usuarios -> Listar todos os usuários (sem senha)
router.get('/usuarios', async (_req, res) => {
    try {
        const query = `
            SELECT id, nome, email, telefone, role, created_at, updated_at
            FROM usuarios
            ORDER BY id
        `;
        const { rows } = await pool.query(query);
        console.log('Fetched users:', rows.length);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('GET /usuarios error', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    try {
        const inserted = await db`
            INSERT INTO usuarios (nome, email, senha, telefone)
            VALUES (${nome}, ${email}, ${senha}, ${telefone})
            RETURNING id, nome, email, telefone, created_at, updated_at
        `;
        res.status(201).json(inserted[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Email already in use' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT - Atualizar Usuario
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const nome = req.body.nome ?? req.body.name;
    const email = req.body.email;
    const senha = req.body.senha ?? req.body.password;
    const telefone = req.body.telefone ?? req.body.phone;

    try {
        // Atualiza apenas os campos fornecidos
        const existing = await db`SELECT * FROM usuarios WHERE id = ${id}`;
        if (existing.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updated = await db`
            UPDATE usuarios SET
                nome = COALESCE(${nome}, nome),
                email = COALESCE(${email}, email),
                senha = COALESCE(${senha}, senha),
                telefone = COALESCE(${telefone}, telefone),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id, nome, email, telefone, created_at, updated_at
        `;
        res.status(200).json(updated[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email already in use' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE - Deletar Usuario
router.delete('/:id', async (req, res)  => {
    const { id } = req.params;
    try {
        const result = await db`DELETE FROM usuarios WHERE id = ${id} RETURNING id`;
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