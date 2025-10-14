# Mobile Marketplace Services - Backend

Backend para um marketplace de serviços, desenvolvido em Node.js com Express, PostgreSQL e autenticação JWT. Permite cadastro de usuários, criação de serviços, envio de propostas por prestadores e gerenciamento seguro de dados.

---

## Tecnologias e Bibliotecas

- **Node.js**: Ambiente de execução JavaScript.
- **Express**: Framework web para Node.js.
- **PostgreSQL**: Banco de dados relacional.
- **postgres**: Cliente SQL para Node.js (usado para queries).
- **pg**: Driver PostgreSQL.
- **jsonwebtoken**: Autenticação via JWT.
- **bcrypt**: Hash de senhas.
- **dotenv**: Variáveis de ambiente.
- **cors**: Middleware para CORS.
- **uuid**: Geração de identificadores únicos.
- **Docker**: Containerização do backend.

---

## Estrutura de Pastas

```
Backend/
  Database/
    Database-MobileServices.sql
    InitialData-MobileServices.sql
  Server/
    index.js
    db.mjs
    .env
    dockerfile
    package.json
    middleware/
      auth.js
    routes/
      auth.js
      user.js
      services.js
      proposals.js
```

---

## Endpoints da API

### Autenticação

#### POST `/auth/login`
Autentica usuário e retorna token JWT.

**Exemplo:**
```json
{
  "email": "usuario@email.com",
  "senha": "suasenha"
}
```

#### POST `/auth/register`
Registra novo usuário.

**Exemplo:**
```json
{
  "nome": "João",
  "email": "joao@email.com",
  "senha": "123456",
  "cpf": "000.000.000-00"
}
```

---

### Usuários

#### GET `/user/me`
Retorna dados do usuário autenticado.

#### GET `/user/:id`
Retorna dados de um usuário pelo ID.

---

### Serviços

#### GET `/services`
Lista todos os serviços.

#### GET `/services/:id`
Retorna um serviço específico.

#### POST `/services`
Cria um novo serviço.

**Exemplo:**
```json
{
  "nome": "Pintura de parede",
  "descricao": "Pintura residencial",
  "valor_minimo": 100,
  "valor_maximo": 300,
  "data_inicio": "2025-10-15T10:00:00Z",
  "data_fim": "2025-10-20T18:00:00Z",
  "local": "Rua X, 123",
  "user_id": 1,
  "metodo_pagamento": "pix",
  "category_id": 2
}
```

#### PUT `/services/:id`
Atualiza um serviço existente.

#### DELETE `/services/:id`
Remove um serviço.

---

### Propostas

#### GET `/proposals/service/:serviceId`
Lista todas as propostas de um serviço.

#### GET `/proposals/my`
Lista propostas feitas pelo prestador autenticado.

#### POST `/proposals`
Cria uma nova proposta (apenas para usuários com role `prestador`).

**Exemplo:**
```json
{
  "service_id": 1,
  "valor": 150,
  "mensagem": "Posso iniciar amanhã"
}
```

#### PUT `/proposals/:id`
Atualiza valor/mensagem da proposta (apenas prestador dono).

#### PATCH `/proposals/:id/status`
Atualiza apenas o status da proposta (apenas admin ou cliente dono do serviço).

**Exemplo:**
```json
{
  "status": "concluido"
}
```

#### DELETE `/proposals/:id`
Exclui proposta (apenas prestador dono).

---

### Empresas

#### GET `/company`
Lista todas as empresas (admin) ou empresas que o usuário gerencia (supervisor).

#### POST `/company`
Cria uma nova empresa (apenas admin).

**Exemplo:**
```json
{
  "nome": "Empresa X",
  "descricao": "Descrição da empresa",
  "endereco": "Rua Y, 456",
  "telefone": "11999999999",
  "email": "contato@empresa.com"
}
```

#### PUT `/company/:id`
Atualiza dados de uma empresa (admin ou supervisor da empresa).

#### DELETE `/company/:id`
Remove uma empresa (apenas admin).

---

#### GET `/company/:id/users`
Lista funcionários de uma empresa (admin ou supervisor da empresa).

#### POST `/company/:id/users`
Adiciona funcionário à empresa (admin ou supervisor).

**Exemplo:**
```json
{
  "user_id": 2,
  "company_role": "funcionario"
}
```

#### PUT `/company/:companyId/users/:userId`
Atualiza o cargo de um funcionário na empresa (admin ou supervisor da empresa).

**Exemplo:**
```json
{
  "company_role": "supervisor"
}
```

#### DELETE `/company/:companyId/users/:userId`
Remove funcionário da empresa (admin ou supervisor da empresa).

---

## Autenticação & Autorização

- JWT obrigatório para rotas protegidas.
- Roles: `admin`, `cliente`, `prestador`.
- Apenas prestadores podem criar propostas.
- Apenas admin ou cliente dono do serviço pode alterar status da proposta.

---

## Docker

O backend pode ser executado em container Docker.  
**Build e execução:**
```sh
docker build -t mobile-marketplace-backend .
docker run -p 3000:3000 --env-file .env mobile-marketplace-backend
```

---

## Banco de Dados

O schema está em `Database/Database-MobileServices.sql`.  
Inclui tabelas para usuários, serviços, propostas, categorias, empresas, etc.

---

## Observações

- As respostas de erro seguem o padrão `{ "error": "mensagem" }`.
- Para acessar rotas protegidas, envie o header:  
  `Authorization: Bearer <seu_token_jwt>`

---
