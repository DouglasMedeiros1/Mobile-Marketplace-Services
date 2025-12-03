# 📱 Mobile Marketplace Services - Documentação da API

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Autenticação](#autenticação)
- [Sistema de Roles](#sistema-de-roles)
- [Endpoints](#endpoints)
  - [Autenticação (`/auth`)](#autenticação-auth)
  - [Usuários (`/user`)](#usuários-user)
  - [Serviços (`/services`)](#serviços-services)
  - [Propostas (`/proposals`)](#propostas-proposals)
  - [Empresas (`/company`)](#empresas-company)
  - [Roles (`/user/:userId/roles`)](#gerenciamento-de-roles-useruseridrroles)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O **Mobile Marketplace Services** é uma API RESTful para um marketplace de serviços móveis que conecta:
- **Clientes**: Usuários que solicitam serviços
- **Prestadores**: Usuários que oferecem serviços
- **Administradores**: Gerenciam o sistema
- **Empresas**: Organizações com funcionários e supervisores

### Tecnologias
- **Node.js** v20+ com Express
- **PostgreSQL** (via Supabase)
- **JWT** para autenticação
- **bcrypt** para hash de senhas

### Servidor
- **Porta padrão**: 3000
- **Base URL**: `http://localhost:3000`

---

## 🏗️ Arquitetura

### Estrutura de Pastas
```
Server/
├── app.js              # Configuração do Express e rotas
├── index.js            # Entry point do servidor
├── db.mjs              # Conexão com PostgreSQL
├── middleware/
│   ├── auth.js         # Middlewares de autenticação/autorização
│   └── ownership.js    # Middlewares de ownership (futuro)
└── routes/
    ├── auth.js         # Rotas de autenticação
    ├── user.js         # CRUD de usuários
    ├── services.js     # CRUD de serviços
    ├── proposals.js    # CRUD de propostas
    ├── company.js      # CRUD de empresas e funcionários
    └── roles.js        # Gerenciamento de roles
```

### Fluxo de Requisição
```
Cliente → Express → Middleware (CORS, JSON Parser) 
       → Autenticação (JWT) 
       → Autorização (Roles) 
       → Controller (Rota) 
       → Database (PostgreSQL) 
       → Response
```

### Banco de Dados
- **Users**: Dados pessoais (nome, email, cpf, rating, bio)
- **Role_user**: Relação usuário-role (N:N)
- **Services**: Serviços solicitados por clientes
- **Proposals**: Propostas enviadas por prestadores
- **Companies**: Empresas cadastradas
- **Company_user**: Relação empresa-funcionário
- **Recovery_keys**: Códigos de recuperação de senha
- **Record_login**: Histórico de logins

---

## 🔐 Autenticação

### JWT (JSON Web Token)
Todas as rotas protegidas exigem um token JWT no header:

```http
Authorization: Bearer <seu-token-jwt>
```

### Obtenção do Token
1. **Registro**: `POST /auth/register`
2. **Login**: `POST /auth/login` → retorna `{ token, user }`
3. **Uso**: Incluir token em todas as requisições protegidas

### Estrutura do Token (Payload)
```json
{
  "userId": 123,
  "roles": ["cliente", "prestador"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

### Blacklist de Tokens
- Tokens revogados são armazenados em memória (Set)
- ⚠️ **Não persiste entre reinícios do servidor**
- ⚠️ **Não funciona em ambientes multi-instância**
- 💡 **Recomendação para produção**: Migrar para Redis ou tabela no DB

---

## 👥 Sistema de Roles

### Roles Disponíveis
| Role | Descrição | Permissões |
|------|-----------|-----------|
| **admin** | Administrador do sistema | Acesso total (criar/editar/deletar tudo) |
| **cliente** | Usuário que solicita serviços | Criar serviços, aceitar/cancelar propostas |
| **prestador** | Usuário que oferece serviços | Criar propostas, editar próprias propostas |

### Múltiplos Roles
Um usuário pode ter múltiplos roles simultaneamente:
```json
{
  "id": 123,
  "nome": "João Silva",
  "roles": ["cliente", "prestador"]
}
```

### Company Roles (Contexto de Empresa)
| Role | Descrição |
|------|-----------|
| **supervisor** | Gerencia funcionários e dados da empresa |
| **funcionario** | Funcionário regular da empresa |

---

## 📡 Endpoints

### Convenções
- ✅ **Público**: Acesso sem autenticação
- 🔒 **Protegido**: Requer token JWT
- 🔑 **Role específico**: Requer role específico (admin, cliente, prestador)

---

## 🔑 Autenticação (`/auth`)

### POST `/auth/register`
Cadastra novo usuário (cliente ou prestador).

**Público** ✅

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "cpf": "12345678900",
  "telefone": "11999999999",
  "cep": "01310-100",
  "bio": "Prestador de serviços gerais",
  "role": "cliente"  // ou "prestador"
}
```

**Campos obrigatórios**: `nome`, `email`, `senha`, `cpf`, `role`

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11999999999",
    "cep": "01310-100",
    "cpf": "12345678900",
    "bio": "Prestador de serviços gerais"
  },
  "role": "cliente"
}
```

**Erros:**
- `400`: Email ou CPF já cadastrado
- `403`: Role inválido (apenas cliente/prestador permitidos)

---

### POST `/auth/login`
Realiza login e retorna token JWT.

**Público** ✅

**Body:**
```json
{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "roles": ["cliente", "prestador"]
  }
}
```

**Erros:**
- `400`: Email ou senha ausentes
- `401`: Credenciais inválidas

---

### POST `/auth/logout`
Revoga o token JWT (blacklist).

**Protegido** 🔒

**Headers:**
```http
Authorization: Bearer <seu-token>
```

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso. O token foi invalidado."
}
```

---

### GET `/auth/me`
Retorna dados do usuário autenticado.

**Protegido** 🔒

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "11999999999",
  "cep": "01310-100",
  "cpf": "12345678900",
  "bio": "Prestador de serviços gerais",
  "roles": ["cliente", "prestador"]
}
```

---

### POST `/auth/password/forgot`
Solicita código de recuperação de senha.

**Público** ✅

**Body:**
```json
{
  "email": "joao@example.com"
}
```

**Response (200):**
```json
{
  "message": "Se o email existir, um código de recuperação foi enviado."
}
```

📝 **Nota**: Sempre retorna 200 para não vazar informações sobre emails cadastrados.

---

### POST `/auth/password/reset`
Redefine senha usando código de recuperação.

**Público** ✅

**Body:**
```json
{
  "email": "joao@example.com",
  "recovery_code": "123456",
  "new_password": "novaSenha123"
}
```

**Response (200):**
```json
{
  "message": "Senha redefinida com sucesso."
}
```

**Erros:**
- `400`: Código inválido ou expirado

---

## 👤 Usuários (`/user`)

### GET `/user/all`
Lista todos os usuários (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11999999999",
    "cep": "01310-100",
    "cpf": "12345678900",
    "rating": null,
    "bio": "Prestador de serviços gerais",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "roles": ["cliente", "prestador"]
  }
]
```

---

### GET `/user/me`
Retorna dados do usuário autenticado.

**Protegido** 🔒

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@example.com",
  "roles": ["cliente"]
}
```

---

### GET `/user/:id`
Retorna dados de um usuário específico (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@example.com",
  "roles": ["cliente", "prestador"]
}
```

---

### PUT `/user/:id`
Atualiza dados de um usuário (próprio usuário ou admin).

**Protegido** 🔒

**Body:**
```json
{
  "nome": "João Silva Junior",
  "email": "joao.junior@example.com",
  "telefone": "11888888888",
  "cep": "01310-200",
  "bio": "Novo texto bio"
}
```

**Campos permitidos**: `nome`, `email`, `telefone`, `cep`, `bio`  
**Campos protegidos**: `cpf`, `senha` (não podem ser alterados por esta rota)

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva Junior",
  "email": "joao.junior@example.com",
  "telefone": "11888888888",
  "cep": "01310-200",
  "bio": "Novo texto bio"
}
```

**Erros:**
- `400`: Email já cadastrado
- `403`: Tentativa de editar outro usuário sem ser admin
- `404`: Usuário não encontrado

---

### DELETE `/user/me`
Deleta usuário autenticado.

**Protegido** 🔒

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### DELETE `/user/:id`
Deleta usuário por ID (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## 🛠️ Serviços (`/services`)

### GET `/services`
Lista todos os serviços.

**Público** ✅

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Reparo de Celular",
    "descricao": "Troca de tela iPhone 12",
    "valor_minimo": 200.00,
    "valor_maximo": 400.00,
    "data_inicio": null,
    "data_fim": "2024-12-31",
    "local": "São Paulo, SP",
    "user_id": 5,
    "metodo_pagamento": "PIX",
    "category_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/services/:id`
Retorna um serviço específico.

**Público** ✅

**Response (200):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular",
  "descricao": "Troca de tela iPhone 12",
  "valor_minimo": 200.00,
  "valor_maximo": 400.00,
  "data_fim": "2024-12-31",
  "local": "São Paulo, SP",
  "user_id": 5
}
```

---

### POST `/services`
Cria um novo serviço.

**Protegido** 🔒

**Body:**
```json
{
  "nome": "Reparo de Celular",
  "descricao": "Troca de tela iPhone 12",
  "valor_minimo": 200.00,
  "valor_maximo": 400.00,
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31",
  "local": "São Paulo, SP",
  "metodo_pagamento": "PIX",
  "category_id": 1
}
```

**Campos obrigatórios**: `nome`, `valor_minimo`, `valor_maximo`, `data_fim`, `category_id`

**Validações:**
- `valor_minimo` e `valor_maximo` > 0
- `valor_minimo` ≤ `valor_maximo`

**Response (201):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular",
  "user_id": 5,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400`: Campos obrigatórios ausentes ou valores inválidos

---

### PUT `/services/:id`
Atualiza um serviço (apenas criador ou admin).

**Protegido** 🔒

**Body:** (campos opcionais)
```json
{
  "nome": "Reparo de Celular - Atualizado",
  "valor_minimo": 250.00,
  "valor_maximo": 450.00
}
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "Reparo de Celular - Atualizado",
  "valor_minimo": 250.00,
  "valor_maximo": 450.00,
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

**Erros:**
- `403`: Acesso negado (não é criador nem admin)
- `404`: Serviço não encontrado

---

### DELETE `/services/:id`
Deleta um serviço (apenas criador ou admin).

**Protegido** 🔒

**Response (200):**
```json
{
  "message": "Serviço deletado com sucesso"
}
```

**Erros:**
- `403`: Acesso negado
- `404`: Serviço não encontrado

📝 **Nota**: Deleta também todas as propostas relacionadas (CASCADE)

---

## 💼 Propostas (`/proposals`)

### GET `/proposals/service/:serviceId`
Lista todas as propostas de um serviço.

**Protegido** 🔒

**Response (200):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "prestador_id": 10,
    "valor": 300.00,
    "mensagem": "Posso fazer em 2 dias",
    "status": "aberto",
    "prestador_nome": "Maria Santos",
    "prestador_email": "maria@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/proposals/my`
Lista propostas enviadas pelo prestador autenticado.

**Protegido** 🔒 + **Prestador** 🔑

**Response (200):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "valor": 300.00,
    "status": "aberto",
    "servico_nome": "Reparo de Celular"
  }
]
```

---

### POST `/proposals`
Cria uma nova proposta (apenas prestadores).

**Protegido** 🔒 + **Prestador** 🔑

**Body:**
```json
{
  "service_id": 1,
  "valor": 300.00,
  "mensagem": "Posso fazer em 2 dias"
}
```

**Campos obrigatórios**: `service_id`, `valor`

**Validações:**
- `valor` > 0
- Prestador não pode ter proposta duplicada para o mesmo serviço

**Response (201):**
```json
{
  "id": 1,
  "service_id": 1,
  "prestador_id": 10,
  "valor": 300.00,
  "status": "aberto"
}
```

**Erros:**
- `400`: Valor inválido
- `409`: Proposta já enviada para este serviço

---

### PUT `/proposals/:id`
Atualiza valor/mensagem da proposta (apenas prestador dono).

**Protegido** 🔒 + **Prestador** 🔑

**Body:**
```json
{
  "valor": 350.00,
  "mensagem": "Posso fazer em 1 dia"
}
```

**Response (200):**
```json
{
  "id": 1,
  "valor": 350.00,
  "mensagem": "Posso fazer em 1 dia"
}
```

---

### PATCH `/proposals/:id/status`
Atualiza status da proposta.

**Protegido** 🔒

**Body:**
```json
{
  "status": "aceito"  // aceito, recusado, cancelado
}
```

**Status permitidos**: `aberto`, `aceito`, `recusado`, `cancelado`

**Regras de autorização:**
- **aceito/cancelado**: Apenas cliente dono do serviço ou admin
- **recusado**: Cliente, prestador (própria proposta) ou admin

**Response (200):**
```json
{
  "id": 1,
  "status": "aceito",
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

**Erros:**
- `400`: Status inválido
- `403`: Permissão insuficiente
- `404`: Proposta não encontrada

---

### DELETE `/proposals/:id`
Deleta uma proposta (apenas prestador dono).

**Protegido** 🔒 + **Prestador** 🔑

**Response (200):**
```json
{
  "message": "Proposta deletada com sucesso"
}
```

---

## 🏢 Empresas (`/company`)

### GET `/company`
Lista empresas (admin vê todas, supervisor vê as que gerencia).

**Protegido** 🔒

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "TechServices LTDA",
    "descricao": "Empresa de serviços de TI",
    "endereco": "Av. Paulista, 1000",
    "telefone": "11988888888",
    "email": "contato@techservices.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST `/company`
Cria uma empresa (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Body:**
```json
{
  "nome": "TechServices LTDA",
  "descricao": "Empresa de serviços de TI",
  "endereco": "Av. Paulista, 1000",
  "telefone": "11988888888",
  "email": "contato@techservices.com"
}
```

**Campo obrigatório**: `nome`

**Response (201):**
```json
{
  "id": 1,
  "nome": "TechServices LTDA",
  "email": "contato@techservices.com"
}
```

---

### PUT `/company/:id`
Atualiza dados da empresa (admin ou supervisor da empresa).

**Protegido** 🔒

**Body:**
```json
{
  "nome": "TechServices LTDA - Matriz",
  "telefone": "11977777777"
}
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "TechServices LTDA - Matriz",
  "telefone": "11977777777",
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE `/company/:id`
Deleta uma empresa (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
{
  "message": "Empresa deletada com sucesso"
}
```

---

### GET `/company/:id/users`
Lista funcionários da empresa (admin ou supervisor da empresa).

**Protegido** 🔒

**Response (200):**
```json
[
  {
    "id": 5,
    "nome": "Carlos Silva",
    "email": "carlos@example.com",
    "company_role": "supervisor"
  },
  {
    "id": 10,
    "nome": "Ana Costa",
    "email": "ana@example.com",
    "company_role": "funcionario"
  }
]
```

---

### POST `/company/:id/users`
Adiciona funcionário à empresa (admin ou supervisor).

**Protegido** 🔒

**Body:**
```json
{
  "user_id": 15,
  "company_role": "funcionario"  // supervisor ou funcionario
}
```

**Response (201):**
```json
{
  "company_id": 1,
  "user_id": 15,
  "company_role": "funcionario"
}
```

**Erros:**
- `404`: Empresa ou usuário não encontrado
- `409`: Usuário já é funcionário desta empresa

---

### PUT `/company/:companyId/users/:userId`
Atualiza role de um funcionário (admin ou supervisor).

**Protegido** 🔒

**Body:**
```json
{
  "company_role": "supervisor"
}
```

**Response (200):**
```json
{
  "company_id": 1,
  "user_id": 15,
  "company_role": "supervisor"
}
```

---

### DELETE `/company/:companyId/users/:userId`
Remove funcionário da empresa (admin ou supervisor).

**Protegido** 🔒

**Response (200):**
```json
{
  "message": "Funcionário removido da empresa"
}
```

---

## 🎭 Gerenciamento de Roles (`/user/:userId/roles`)

### GET `/user/:userId/roles`
Lista roles de um usuário (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
{
  "userId": 5,
  "roles": ["cliente", "prestador"]
}
```

---

### POST `/user/:userId/roles`
Adiciona role a um usuário (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Body:**
```json
{
  "role": "prestador"
}
```

**Roles válidos**: `admin`, `cliente`, `prestador`

**Response (201):**
```json
{
  "message": "Role 'prestador' adicionado com sucesso",
  "data": {
    "id": 10,
    "user_id": 5,
    "role": "prestador"
  }
}
```

**Erros:**
- `400`: Role inválido
- `404`: Usuário não encontrado
- `409`: Usuário já possui este role

---

### DELETE `/user/:userId/roles/:role`
Remove role de um usuário (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Response (200):**
```json
{
  "message": "Role 'prestador' removido com sucesso"
}
```

**Erros:**
- `400`: Não é possível remover o último role do usuário
- `404`: Usuário não possui este role

---

### PUT `/user/:userId/roles`
Substitui todos os roles de um usuário (apenas admin).

**Protegido** 🔒 + **Admin** 🔑

**Body:**
```json
{
  "roles": ["cliente", "admin"]
}
```

**Response (200):**
```json
{
  "message": "Roles atualizados com sucesso",
  "data": {
    "userId": 5,
    "roles": ["cliente", "admin"]
  }
}
```

**Validações:**
- Array não pode estar vazio
- Apenas roles válidos são aceitos
- Duplicatas são removidas automaticamente

---

## 📊 Códigos de Status

| Código | Significado | Uso Comum |
|--------|-------------|-----------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Dados inválidos ou ausentes |
| **401** | Unauthorized | Token ausente, inválido ou expirado |
| **403** | Forbidden | Permissão insuficiente (role inadequado) |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Conflito (ex: email duplicado) |
| **500** | Internal Server Error | Erro no servidor |

---

## 💡 Exemplos de Uso

### Exemplo 1: Fluxo Cliente
```bash
# 1. Registrar cliente
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "email": "maria@example.com",
    "senha": "senha123",
    "cpf": "98765432100",
    "role": "cliente"
  }'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "senha": "senha123"
  }'
# Retorna: { "token": "eyJhbGc...", "user": {...} }

# 3. Criar serviço (usar token)
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "nome": "Reparo de Celular",
    "valor_minimo": 200,
    "valor_maximo": 400,
    "data_fim": "2024-12-31",
    "category_id": 1
  }'

# 4. Ver propostas do serviço
curl -X GET http://localhost:3000/proposals/service/1 \
  -H "Authorization: Bearer eyJhbGc..."

# 5. Aceitar proposta
curl -X PATCH http://localhost:3000/proposals/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"status": "aceito"}'
```

### Exemplo 2: Fluxo Prestador
```bash
# 1. Registrar prestador
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Técnico",
    "email": "joao@example.com",
    "senha": "senha123",
    "cpf": "11122233344",
    "role": "prestador"
  }'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senha123"
  }'

# 3. Ver serviços disponíveis
curl -X GET http://localhost:3000/services

# 4. Enviar proposta
curl -X POST http://localhost:3000/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "service_id": 1,
    "valor": 300,
    "mensagem": "Posso fazer em 2 dias úteis"
  }'

# 5. Ver minhas propostas
curl -X GET http://localhost:3000/proposals/my \
  -H "Authorization: Bearer eyJhbGc..."
```

### Exemplo 3: Gerenciamento de Empresa
```bash
# 1. Admin cria empresa
curl -X POST http://localhost:3000/company \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "nome": "TechServices LTDA",
    "email": "contato@techservices.com"
  }'

# 2. Adicionar supervisor
curl -X POST http://localhost:3000/company/1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "user_id": 5,
    "company_role": "supervisor"
  }'

# 3. Supervisor adiciona funcionário
curl -X POST http://localhost:3000/company/1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <supervisor-token>" \
  -d '{
    "user_id": 10,
    "company_role": "funcionario"
  }'
```

---

## 🔧 Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Servidor
NODE_ENV=production
PORT=3000

# Banco de dados
DB_CONNECTION_STRING=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-key-change-me
JWT_EXPIRES_IN=24h

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

---

## 🚀 Como Executar

### Desenvolvimento
```bash
cd Backend/Server
npm install
npm start
```

### Docker
```bash
# Build da imagem
docker build -t mobile-marketplace-backend:latest .

# Executar container
docker run -d -p 3000:3000 \
  -e DB_CONNECTION_STRING="postgresql://..." \
  -e JWT_SECRET="seu-secret" \
  --name marketplace-server \
  mobile-marketplace-backend:latest
```

---

## 📝 Notas Importantes

### Segurança
- ⚠️ **Nunca commit** credenciais reais (use `.env` e `.gitignore`)
- 🔐 **JWT_SECRET** deve ser uma string aleatória forte em produção
- 🔑 **Blacklist de tokens** não persiste em memória (migrar para Redis/DB)
- 🛡️ **CORS** está habilitado para todos os domínios (ajustar em produção)

### Banco de Dados
- 💾 Connection string está **hardcoded** em `db.mjs` (migrar para .env)
- 🗄️ Supabase em uso (PostgreSQL cloud)
- ⚙️ Migrations/seeds devem ser aplicados manualmente

### Melhorias Futuras
- [ ] Rate limiting para prevenir ataques
- [ ] Validação de schema (Joi/Yup)
- [ ] Paginação de resultados
- [ ] Upload de imagens (serviços/perfis)
- [ ] Sistema de avaliações (ratings)
- [ ] Notificações push
- [ ] WebSockets para chat/notificações em tempo real

---

**Documentação gerada em**: 24/11/2025  
**Versão da API**: 1.0.0  
**Autor**: Douglas Medeiros
