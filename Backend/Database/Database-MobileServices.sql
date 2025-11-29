
CREATE DATABASE MobileServices;
\c MobileServices; 

CREATE TYPE role_enum AS ENUM ('admin', 'cliente', 'prestador');
CREATE TYPE company_role_enum AS ENUM ('supervisor', 'funcionario');
CREATE TYPE service_status_enum AS ENUM ('aberto', 'em andamento', 'concluido', 'cancelado');

-- Tabelas (nomes em snake_case)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    rating REAL CHECK (rating BETWEEN 0 AND 5) DEFAULT 0,
    bio TEXT,
    disponivel_servico_rapido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role role_enum NOT NULL,
    UNIQUE (user_id, role)
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE company_user (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_role company_role_enum NOT NULL,
    UNIQUE (company_id, user_id)
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    valor_minimo NUMERIC(10,2) NOT NULL,
    valor_maximo NUMERIC(10,2),
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    local VARCHAR(150),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metodo_pagamento VARCHAR(50),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    quick BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_quick ON services(quick) WHERE quick = TRUE;

CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    prestador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    mensagem TEXT,
    status VARCHAR(50) DEFAULT 'aberto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (service_id, prestador_id)
);

CREATE TABLE record_login (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_senha UNIQUE (user_id, hash)
);

CREATE TABLE record_service (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    prestador_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP NOT NULL,
    status service_status_enum NOT NULL,
    avaliacao_prestador INTEGER CHECK (avaliacao_prestador BETWEEN 1 AND 5),
    avaliacao_cliente INTEGER CHECK (avaliacao_cliente BETWEEN 1 AND 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recovery_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recovery_code VARCHAR(6),
    expired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

