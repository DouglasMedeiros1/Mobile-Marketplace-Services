const express = require('express');
const router = express.Router();
const dbModule = require('../db.mjs');
const db = dbModule.default;
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Funções auxiliares
async function getUserCompanies(userId) {
    return await db`SELECT company_id, company_role FROM company_user WHERE user_id = ${userId}`;
}
async function isSupervisorOfCompany(userId, companyId) {
    const result = await db`
        SELECT 1 FROM company_user 
        WHERE user_id = ${userId} AND company_id = ${companyId} AND company_role = 'supervisor'
    `;
    return result.length > 0;
}

// CRUD de empresas

// Listar empresas (admin ou supervisor vê as que gerencia)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    try {
        let result;
        if (roles.includes('admin')) {
            result = await db`SELECT * FROM companies ORDER BY id`;
        } else {
            result = await db`
                SELECT c.* FROM companies c
                JOIN company_user cu ON cu.company_id = c.id
                WHERE cu.user_id = ${userId} AND cu.company_role = 'supervisor'
            `;
        }
        res.status(200).json(result);
    } catch (err) {
        console.error('GET /company ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Criar empresa (apenas admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { nome, descricao, endereco, telefone, email } = req.body;
    
    if (!nome) {
        return res.status(400).json({ error: 'Campo nome é obrigatório' });
    }

    try {
        const result = await db`
            INSERT INTO companies (nome, descricao, endereco, telefone, email)
            VALUES (${nome}, ${descricao}, ${endereco}, ${telefone}, ${email})
            RETURNING *
        `;
        res.status(201).json(result[0]);
    } catch (err) {
        console.error('POST /company ERROR:', err);
        
        // Tratamento de erro UNIQUE constraint (email)
        if (err.code === '23505' && err.constraint === 'companies_email_key') {
            return res.status(400).json({ error: 'Email já cadastrado para outra empresa.' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Atualizar empresa (admin ou supervisor da empresa)
router.put('/:id', authenticateToken, async (req, res) => {
    const companyId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const roles = req.user.roles || [];
    
    if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        // Transação para verificar autorização e atualizar
        const result = await db.begin(async sql => {
            // Verifica se empresa existe
            const companyExists = await sql`
                SELECT id FROM companies WHERE id = ${companyId}
            `;
            
            if (companyExists.length === 0) {
                throw { status: 404, message: 'Empresa não encontrada' };
            }

            // Verifica autorização
            const isAdmin = roles.includes('admin');
            const isSupervisor = await isSupervisorOfCompany(userId, companyId);

            if (!isAdmin && !isSupervisor) {
                throw { status: 403, message: 'Acesso negado' };
            }

            // Atualiza empresa
            const { nome, descricao, endereco, telefone, email } = req.body;
            const updated = await sql`
                UPDATE companies SET
                    nome = COALESCE(${nome}, nome),
                    descricao = COALESCE(${descricao}, descricao),
                    endereco = COALESCE(${endereco}, endereco),
                    telefone = COALESCE(${telefone}, telefone),
                    email = COALESCE(${email}, email),
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = ${userId}
                WHERE id = ${companyId}
                RETURNING *
            `;

            return updated[0];
        });

        res.status(200).json(result);
    } catch (err) {
        console.error('PUT /company/:id ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        
        // Tratamento de erro UNIQUE constraint (email)
        if (err.code === '23505' && err.constraint === 'companies_email_key') {
            return res.status(400).json({ error: 'Email já cadastrado para outra empresa.' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Deletar empresa (apenas admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const companyId = parseInt(req.params.id, 10);
    
    if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        // Transação para deletar empresa
        await db.begin(async sql => {
            const result = await sql`
                DELETE FROM companies WHERE id = ${companyId} RETURNING id
            `;
            
            if (result.length === 0) {
                throw { status: 404, message: 'Empresa não encontrada' };
            }
        });

        res.status(200).json({ message: 'Empresa deletada com sucesso' });
    } catch (err) {
        console.error('DELETE /company/:id ERROR:', err);
        
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// CRUD de funcionários da empresa

// Listar funcionários de uma empresa (admin ou supervisor da empresa)
router.get('/:id/users', authenticateToken, async (req, res) => {
    const companyId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const roles = req.user.roles || [];
    
    if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        if (
            !roles.includes('admin') &&
            !(await isSupervisorOfCompany(userId, companyId))
        ) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const result = await db`
            SELECT u.id, u.nome, u.email, cu.company_role
            FROM users u
            JOIN company_user cu ON cu.user_id = u.id
            WHERE cu.company_id = ${companyId}
        `;
        res.status(200).json(result);
    } catch (err) {
        console.error('GET /company/:id/users ERROR:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Adicionar funcionário à empresa (admin ou supervisor)
router.post('/:id/users', authenticateToken, async (req, res) => {
    const companyId = parseInt(req.params.id, 10);
    const { user_id, company_role } = req.body;
    const userId = req.user.id;
    const roles = req.user.roles || [];
    
    if (isNaN(companyId) || !user_id || !company_role) {
        return res.status(400).json({ error: 'Dados inválidos. Campos obrigatórios: user_id, company_role' });
    }

    // Valida company_role
    if (!['supervisor', 'funcionario'].includes(company_role.toLowerCase())) {
        return res.status(400).json({ error: 'company_role inválido. Valores permitidos: supervisor, funcionario' });
    }

    try {
        // Transação para verificar autorização e adicionar funcionário
        const result = await db.begin(async sql => {
            // Verifica autorização
            const isAdmin = roles.includes('admin');
            const isSupervisor = await isSupervisorOfCompany(userId, companyId);

            if (!isAdmin && !isSupervisor) {
                throw { status: 403, message: 'Acesso negado' };
            }

            // Verifica se empresa existe
            const companyExists = await sql`
                SELECT id FROM companies WHERE id = ${companyId}
            `;
            if (companyExists.length === 0) {
                throw { status: 404, message: 'Empresa não encontrada' };
            }

            // Verifica se usuário existe
            const userExists = await sql`
                SELECT id FROM users WHERE id = ${user_id}
            `;
            if (userExists.length === 0) {
                throw { status: 404, message: 'Usuário não encontrado' };
            }

            // Verifica se já existe (UNIQUE constraint)
            const alreadyExists = await sql`
                SELECT 1 FROM company_user WHERE company_id = ${companyId} AND user_id = ${user_id}
            `;
            if (alreadyExists.length > 0) {
                throw { status: 409, message: 'Usuário já é funcionário desta empresa' };
            }

            // Adiciona funcionário
            const inserted = await sql`
                INSERT INTO company_user (company_id, user_id, company_role)
                VALUES (${companyId}, ${user_id}, ${company_role})
                RETURNING *
            `;

            return inserted[0];
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('POST /company/:id/users ERROR:', err);
        
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.status === 409) {
            return res.status(409).json({ error: err.message });
        }
        
        // Tratamento de erro UNIQUE constraint (fallback)
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Usuário já é funcionário desta empresa' });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Atualizar funcionário da empresa (admin ou supervisor da empresa)
router.put('/:companyId/users/:userId', authenticateToken, async (req, res) => {
    const companyId = parseInt(req.params.companyId, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const { company_role } = req.body;
    const userId = req.user.id;
    const roles = req.user.roles || [];
    
    if (isNaN(companyId) || isNaN(targetUserId) || !company_role) {
        return res.status(400).json({ error: 'Dados inválidos. Campo obrigatório: company_role' });
    }

    // Valida company_role
    if (!['supervisor', 'funcionario'].includes(company_role.toLowerCase())) {
        return res.status(400).json({ error: 'company_role inválido. Valores permitidos: supervisor, funcionario' });
    }

    try {
        // Transação para verificar autorização e atualizar
        const result = await db.begin(async sql => {
            // Verifica autorização
            const isAdmin = roles.includes('admin');
            const isSupervisor = await isSupervisorOfCompany(userId, companyId);

            if (!isAdmin && !isSupervisor) {
                throw { status: 403, message: 'Acesso negado' };
            }

            // Atualiza company_role
            const updated = await sql`
                UPDATE company_user SET company_role = ${company_role}
                WHERE company_id = ${companyId} AND user_id = ${targetUserId}
                RETURNING *
            `;

            if (updated.length === 0) {
                throw { status: 404, message: 'Funcionário não encontrado' };
            }

            return updated[0];
        });

        res.status(200).json(result);
    } catch (err) {
        console.error('PUT /company/:companyId/users/:userId ERROR:', err);
        
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Remover funcionário da empresa (admin ou supervisor da empresa)
router.delete('/:companyId/users/:userId', authenticateToken, async (req, res) => {
    const companyId = parseInt(req.params.companyId, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const userId = req.user.id;
    const roles = req.user.roles || [];
    
    if (isNaN(companyId) || isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
        // Transação para verificar autorização e remover
        await db.begin(async sql => {
            // Verifica autorização
            const isAdmin = roles.includes('admin');
            const isSupervisor = await isSupervisorOfCompany(userId, companyId);

            if (!isAdmin && !isSupervisor) {
                throw { status: 403, message: 'Acesso negado' };
            }

            // Remove funcionário
            const result = await sql`
                DELETE FROM company_user WHERE company_id = ${companyId} AND user_id = ${targetUserId}
                RETURNING *
            `;

            if (result.length === 0) {
                throw { status: 404, message: 'Funcionário não encontrado' };
            }
        });

        res.status(200).json({ message: 'Funcionário removido da empresa' });
    } catch (err) {
        console.error('DELETE /company/:companyId/users/:userId ERROR:', err);
        
        if (err.status === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
// ...fim do arquivo...