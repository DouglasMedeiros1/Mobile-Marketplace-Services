-- Insira os dados no banco MobileServices (conecte-se com: \c MobileServices)

-- Inserindo categorias
INSERT INTO categorias (nome) VALUES
('Limpeza'),
('Jardinagem'),
('Informática'),
('Aulas Particulares'),
('Reparos');

-- Inserindo usuários
INSERT INTO usuarios (nome, email, senha, telefone) VALUES
('Ana Silva', 'ana@email.com', 'senha1', '11999990001'),
('Bruno Souza', 'bruno@email.com', 'senha2', '21999990002'),
('Carla Dias', 'carla@email.com', 'senha3', '31999990003'),
('Diego Lima', 'diego@email.com', 'senha4', '41999990004'),
('Eduarda Melo', 'eduarda@email.com', 'senha5', '51999990005');

-- Inserindo serviços
INSERT INTO servicos (nome, descricao, valor_minimo, valor_maximo, data_fim, metodo_pagamento, usuario_id, categoria_id) VALUES
('Limpeza Residencial', 'Limpeza completa de casas', 100.00, 200.00, '2025-09-22 12:00:00', 'Dinheiro', 1, 1),
('Corte de Grama', 'Corte e manutenção de jardins', 80.00, 150.00, '2025-09-23 11:00:00', 'Pix', 2, 2),
('Formatação de PC', 'Formatação e instalação de softwares', 120.00, 250.00, '2025-09-24 13:00:00', 'Cartão', 3, 3),
('Aula de Matemática', 'Aulas para ensino médio', 60.00, 120.00, '2025-09-25 16:00:00', 'Dinheiro', 4, 4),
('Conserto de Torneira', 'Reparo em encanamento', 50.00, 100.00, '2025-09-26 17:00:00', 'Pix', 5, 5);

-- Inserindo histórico de logins
INSERT INTO historico_logins (usuario_id) VALUES
(1),
(2),
(3),
(4),
(5);

-- Verificação dos dados inseridos
SELECT * FROM categorias;
SELECT * FROM usuarios;
SELECT * FROM servicos;
SELECT * FROM historico_logins;