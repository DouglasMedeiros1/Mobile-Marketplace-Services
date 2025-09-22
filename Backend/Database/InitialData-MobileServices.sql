-- Inserindo categorias
INSERT INTO categorias (nome, area) VALUES
('Limpeza', 'Serviços Domésticos'),
('Jardinagem', 'Serviços Externos'),
('Informática', 'Tecnologia'),
('Aulas Particulares', 'Educação'),
('Reparos', 'Manutenção');

-- Inserindo usuários
INSERT INTO usuarios (nome, email, senha, telefone, cidade, estado, cpf) VALUES
('Ana Silva', 'ana@email.com', 'senha1', '11999990001', 'São Paulo', 'SP', '123.456.789-00'),
('Bruno Souza', 'bruno@email.com', 'senha2', '21999990002', 'Rio de Janeiro', 'RJ', '234.567.890-11'),
('Carla Dias', 'carla@email.com', 'senha3', '31999990003', 'Belo Horizonte', 'MG', '345.678.901-22'),
('Diego Lima', 'diego@email.com', 'senha4', '41999990004', 'Curitiba', 'PR', '456.789.012-33'),
('Eduarda Melo', 'eduarda@email.com', 'senha5', '51999990005', 'Porto Alegre', 'RS', '567.890.123-44');

-- Inserindo serviços
INSERT INTO servicos (nome, descricao, valor_minimo, valor_maximo, data_inicio, data_fim, local, usuario_id, metodo_pagamento, categoria_id) VALUES
('Limpeza Residencial', 'Limpeza completa de casas', 100.00, 200.00, '2025-09-22 08:00:00', '2025-09-22 12:00:00', 'São Paulo', 1, 'Dinheiro', 1),
('Corte de Grama', 'Corte e manutenção de jardins', 80.00, 150.00, '2025-09-23 09:00:00', '2025-09-23 11:00:00', 'Rio de Janeiro', 2, 'Pix', 2),
('Formatação de PC', 'Formatação e instalação de softwares', 120.00, 250.00, '2025-09-24 10:00:00', '2025-09-24 13:00:00', 'Belo Horizonte', 3, 'Cartão', 3),
('Aula de Matemática', 'Aulas para ensino médio', 60.00, 120.00, '2025-09-25 14:00:00', '2025-09-25 16:00:00', 'Curitiba', 4, 'Dinheiro', 4),
('Conserto de Torneira', 'Reparo em encanamento', 50.00, 100.00, '2025-09-26 15:00:00', '2025-09-26 17:00:00', 'Porto Alegre', 5, 'Pix', 5);

-- Inserindo histórico de logins
INSERT INTO historico_logins (usuario_id) VALUES
(1),
(2),
(3),
(4),
(5);

-- Inserindo senhas dos usuários (hashes fictícios)
INSERT INTO usuario_senhas (usuario_id, hash, salt, ativo) VALUES
(1, 'hash1', 'salt1', TRUE),
(2, 'hash2', 'salt2', TRUE),
(3, 'hash3', 'salt3', TRUE),
(4, 'hash4', 'salt4', TRUE),
(5, 'hash5', 'salt5', TRUE);

-- Verificação dos dados inseridos
SELECT * FROM categorias;
SELECT * FROM usuarios;
SELECT * FROM servicos;
SELECT * FROM historico_logins;
SELECT * FROM usuario_senhas;