Create Database MobileServices;
Use MobileServices;


CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cidade VARCHAR(100),
    estado CHAR(2),
    cpf CHAR(14) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_minimo NUMERIC(10,2) NOT NULL,
    valor_maximo NUMERIC(10,2) NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP,
    local VARCHAR(150),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    metodo_pagamento VARCHAR(50),
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historico_logins (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_senhas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expirado_em TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_usuario_senha UNIQUE (usuario_id, hash)
);

CREATE TABLE historico_servicos (
    id SERIAL PRIMARY KEY,
    servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    prestador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    avaliacao_prestador INTEGER CHECK (avaliacao_prestador BETWEEN 1 AND 5),
    avaliacao_cliente INTEGER CHECK (avaliacao_cliente BETWEEN 1 AND 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);