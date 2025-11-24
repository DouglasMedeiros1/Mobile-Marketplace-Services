-- Conecte-se ao banco antes de rodar os CREATE TABLE (psql): \c MobileServices

CREATE DATABASE MobileServices;


CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    avaliacao_media NUMERIC(3,2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificacao (
    id SERIAL PRIMARY KEY,
    recorrencia_valor INTEGER NOT NULL,
    recorrencia_medida VARCHAR(100) NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE prestadores (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    valor_minimo NUMERIC(10,2) NOT NULL,
    valor_maximo NUMERIC(10,2) NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    metodo_pagamento VARCHAR(50),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE propostas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    valor NUMERIC(10,2) NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    prestador_id INTEGER NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE negocio (
    id SERIAL PRIMARY KEY,
    servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    proposta_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historico_logins (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);