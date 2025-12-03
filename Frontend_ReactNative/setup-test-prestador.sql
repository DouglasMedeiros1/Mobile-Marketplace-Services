# Script para configurar prestador de teste para Quick Service
# Execute este script no banco de dados PostgreSQL

-- 1. Verificar se o prestador existe
SELECT id, nome, email, disponivel_servico_rapido, updated_at 
FROM users 
WHERE id = 5;

-- 2. Habilitar disponibilidade do prestador
UPDATE users 
SET disponivel_servico_rapido = true,
    updated_at = NOW()
WHERE id = 5;

-- 3. Verificar se foi atualizado
SELECT id, nome, email, disponivel_servico_rapido, updated_at 
FROM users 
WHERE id = 5;

-- 4. (OPCIONAL) Se o prestador não existir, criar um novo
-- Descomente as linhas abaixo se necessário:

/*
INSERT INTO users (nome, email, senha, cpf, disponivel_servico_rapido, created_at, updated_at)
VALUES (
    'João Técnico',
    'joao@example.com',
    '$2b$10$73J66d6Z4AmoXhurx8Vl5OXOOKEZL.WPg/5ZTKuBy3w3ZyZUqWk..',  -- senha: senha123
    '12345678900',
    true,
    NOW(),
    NOW()
)
RETURNING id, nome, email;

-- Associar role de prestador
INSERT INTO user_roles (user_id, role_id)
SELECT 
    (SELECT id FROM users WHERE email = 'joao@example.com'),
    (SELECT id FROM roles WHERE nome = 'prestador')
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT id FROM users WHERE email = 'joao@example.com')
    AND role_id = (SELECT id FROM roles WHERE nome = 'prestador')
);
*/

-- 5. Verificar roles do prestador
SELECT u.id, u.nome, u.email, r.nome as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = 5;
