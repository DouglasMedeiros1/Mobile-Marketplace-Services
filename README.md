# Mobile Marketplace Services

Sistema de marketplace de serviços móveis conectando clientes e prestadores de serviços através de uma plataforma web e mobile com recursos em tempo real.

**Projeto desenvolvido para**: Programação de Dispositivos Móveis I  
**Empresa parceira**: Neo Reformata  
**Potencial uso**: Produto real em produção

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Configuração do Backend](#configuração-do-backend)
- [Configuração do Frontend Mobile](#configuração-do-frontend-mobile)
- [Download do APK](#download-do-apk)
- [Executando o Sistema](#executando-o-sistema)
- [Documentação Adicional](#documentação-adicional)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Mobile Marketplace Services é uma plataforma completa que permite:

- **Clientes**: Criar solicitações de serviços, receber propostas, contratar prestadores
- **Prestadores**: Enviar propostas, gerenciar serviços, disponibilizar-se para serviços rápidos
- **Chat em tempo real**: Comunicação direta entre clientes e prestadores via WebSocket
- **Serviços Rápidos**: Sistema de matching baseado em geolocalização (estilo Uber)

---

## 🛠️ Tecnologias

### Backend
- Node.js 20+
- Express.js
- PostgreSQL (Supabase)
- WebSocket
- JWT Authentication
- bcrypt

### Frontend Mobile
- React Native 0.82
- TypeScript
- React Navigation
- Axios
- Context API
- AsyncStorage

---

## 📁 Estrutura do Projeto

```
Mobile-Marketplace-Services/
├── Backend/
│   ├── Database/
│   │   ├── Database-MobileServices.sql      # Schema do banco
│   │   └── InitialData-MobileServices.sql   # Dados iniciais
│   └── Server/
│       ├── index.js                         # Entry point
│       ├── app.js                           # Configuração Express
│       ├── .env.example                     # Template de variáveis
│       ├── routes/                          # Rotas da API
│       ├── middleware/                      # Middlewares
│       └── utils/                           # Utilitários
└── Frontend_ReactNative/
    ├── src/
    │   ├── api/                             # Integração API
    │   ├── contexts/                        # Contextos React
    │   ├── navigation/                      # Navegação
    │   ├── pages/                           # Telas
    │   └── types/                           # TypeScript types
    ├── .env.example                         # Template de variáveis
    └── android/                             # Configuração Android
```

---

## 📋 Pré-requisitos

### Backend
- **Node.js**: versão 20 ou superior
- **npm** ou **yarn**
- **PostgreSQL**: 14 ou superior (ou conta Supabase)

### Frontend Mobile
- **Node.js**: versão 20 ou superior
- **Android Studio** (para desenvolvimento Android)
- **JDK 17** (Java Development Kit)
- **Android SDK** (API Level 24+)

### Sistema Operacional
- Windows 10/11 ou Linux (Ubuntu 20.04+)

---

## 🗄️ Configuração do Banco de Dados

### Opção 1: PostgreSQL Local

#### Windows

1. **Baixar PostgreSQL**
   - Acesse: https://www.postgresql.org/download/windows/
   - Instale o PostgreSQL 14+

2. **Criar banco de dados**
   ```cmd
   # Abra o psql ou pgAdmin
   psql -U postgres
   
   # Criar banco
   CREATE DATABASE mobile_marketplace;
   ```

3. **Executar scripts SQL**
   ```cmd
   # No diretório Backend/Database
   psql -U postgres -d mobile_marketplace -f Database-MobileServices.sql
   psql -U postgres -d mobile_marketplace -f InitialData-MobileServices.sql
   ```

#### Linux

1. **Instalar PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Criar banco de dados**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE mobile_marketplace;
   \q
   ```

3. **Executar scripts SQL**
   ```bash
   cd Backend/Database
   sudo -u postgres psql -d mobile_marketplace -f Database-MobileServices.sql
   sudo -u postgres psql -d mobile_marketplace -f InitialData-MobileServices.sql
   ```

### Opção 2: Supabase (Recomendado - Grátis)

1. Criar conta em: https://supabase.com
2. Criar novo projeto
3. Copiar a **Connection String** (Database Settings → Connection String → URI)
4. No SQL Editor do Supabase, executar:
   - Conteúdo de `Database-MobileServices.sql`
   - Conteúdo de `InitialData-MobileServices.sql`

---

## ⚙️ Configuração do Backend

### Windows

1. **Navegar até o diretório do servidor**
   ```cmd
   cd Backend\Server
   ```

2. **Instalar dependências**
   ```cmd
   npm install
   ```

3. **Configurar variáveis de ambiente**
   ```cmd
   copy .env.example .env
   notepad .env
   ```

4. **Editar .env** com suas configurações:
   ```env
   # Banco de Dados
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/mobile_marketplace
   # OU para Supabase:
   DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres

   # JWT
   JWT_SECRET=sua-chave-secreta-muito-segura-aqui

   # Servidor
   PORT=3000
   NODE_ENV=development
   ```

5. **Iniciar servidor**
   ```cmd
   npm start
   ```

### Linux

1. **Navegar até o diretório do servidor**
   ```bash
   cd Backend/Server
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env
   nano .env  # ou vim .env
   ```

4. **Editar .env** (mesmo conteúdo do Windows acima)

5. **Iniciar servidor**
   ```bash
   npm start
   ```

### Verificar se o servidor está rodando

Acesse no navegador: `http://localhost:3000`

Ou teste a API:
```bash
curl http://localhost:3000/services
```

---

## 📱 Configuração do Frontend Mobile

### Windows

1. **Navegar até o diretório do frontend**
   ```cmd
   cd Frontend_ReactNative
   ```

2. **Instalar dependências**
   ```cmd
   npm install
   ```

3. **Configurar variáveis de ambiente**
   ```cmd
   copy .env.example .env
   notepad .env
   ```

4. **Editar .env**:
   ```env
   # Para emulador Android
   API_BASE_URL=http://10.0.2.2:3000
   WS_BASE_URL=ws://10.0.2.2:3000
   NODE_ENV=development

   # Para dispositivo físico na mesma rede, use o IP da sua máquina:
   # API_BASE_URL=http://192.168.1.XXX:3000
   # WS_BASE_URL=ws://192.168.1.XXX:3000
   ```

5. **Iniciar Metro Bundler**
   ```cmd
   npm start
   ```

6. **Em outro terminal, executar no emulador/dispositivo**
   ```cmd
   npm run android
   ```

### Linux

1. **Navegar até o diretório do frontend**
   ```bash
   cd Frontend_ReactNative
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env
   nano .env  # ou vim .env
   ```

4. **Editar .env** (mesmo conteúdo do Windows acima)

5. **Iniciar Metro Bundler**
   ```bash
   npm start
   ```

6. **Em outro terminal, executar no emulador/dispositivo**
   ```bash
   npm run android
   ```

### Configuração do Android Studio (Ambos OS)

1. **Instalar Android Studio**: https://developer.android.com/studio
2. **Instalar Android SDK** (API Level 24+)
3. **Configurar variáveis de ambiente**:

   **Windows**:
   ```cmd
   setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
   setx PATH "%PATH%;%LOCALAPPDATA%\Android\Sdk\platform-tools"
   ```

   **Linux**:
   ```bash
   echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
   echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
   source ~/.bashrc
   ```

4. **Criar emulador Android**:
   - Abrir Android Studio → Device Manager → Create Virtual Device
   - Escolher Pixel 5 (ou similar)
   - System Image: Android 12 (API 31) ou superior
   - Finish

---

## 📲 Download do APK

### APK Pré-compilado

> 🚧 **Em breve**: Link para download do APK será disponibilizado aqui

Enquanto isso, você pode gerar o APK localmente:

### Gerar APK de Release (Windows/Linux)

1. **Navegar até o diretório do frontend**
   ```bash
   cd Frontend_ReactNative/android
   ```

2. **Gerar APK de release**
   ```bash
   # Windows
   .\gradlew assembleRelease

   # Linux
   ./gradlew assembleRelease
   ```

3. **APK gerado em**:
   ```
   Frontend_ReactNative/android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Transferir para dispositivo Android** e instalar

### Instalar APK no dispositivo

**Via ADB (Android Debug Bridge)**:
```bash
adb install app-release.apk
```

**Ou transferir via USB/Email** e instalar diretamente no dispositivo.

---

## 🚀 Executando o Sistema

### Passo a Passo Completo

#### 1. Iniciar o Banco de Dados
- Se PostgreSQL local: Certifique-se de que o serviço está rodando
- Se Supabase: Já está online

#### 2. Iniciar o Backend

**Terminal 1 - Windows**:
```cmd
cd Backend\Server
npm start
```

**Terminal 1 - Linux**:
```bash
cd Backend/Server
npm start
```

Aguarde a mensagem: `✓ Servidor rodando na porta 3000`

#### 3. Iniciar o Frontend Mobile

**Terminal 2 - Windows**:
```cmd
cd Frontend_ReactNative
npm start
```

**Terminal 2 - Linux**:
```bash
cd Frontend_ReactNative
npm start
```

#### 4. Executar no Emulador/Dispositivo

**Terminal 3 - Windows**:
```cmd
cd Frontend_ReactNative
npm run android
```

**Terminal 3 - Linux**:
```bash
cd Frontend_ReactNative
npm run android
```

#### 5. Testar o Sistema

1. **Registrar usuário**:
   - Abra o app
   - Clique em "Criar Conta"
   - Escolha tipo: Cliente ou Prestador
   - Preencha os dados

2. **Explorar funcionalidades**:
   - Ver lista de serviços
   - Criar novo serviço (clientes)
   - Enviar proposta (prestadores)
   - Testar chat
   - Testar serviço rápido

---

## 📚 Documentação Adicional

### Backend
- [API Documentation](Backend/Server/API-DOCUMENTATION.md) - Endpoints REST completos
- [Chat Documentation](Backend/Server/CHAT-DOCUMENTATION.md) - WebSocket e mensagens
- [Quick Service Documentation](Backend/Server/QUICK-SERVICE-README.md) - Sistema de matching

### Frontend
- [Frontend README](Frontend_ReactNative/README.md) - Setup e uso
- [API Endpoints Reference](Frontend_ReactNative/API_ENDPOINTS.md) - Integração
- [Implementation Summary](Frontend_ReactNative/IMPLEMENTATION_SUMMARY.md) - Status

---

## 🐛 Troubleshooting

### Backend não inicia

**Erro: `EADDRINUSE: address already in use :::3000`**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Linux
lsof -i :3000
kill -9 [PID]
```

**Erro: Conexão com banco de dados falhou**
- Verificar se PostgreSQL está rodando
- Verificar credenciais no `.env`
- Testar conexão: `psql -U postgres -d mobile_marketplace`

### Frontend não conecta ao backend

**Android Emulator**:
- Use `http://10.0.2.2:3000` no `.env`
- Não use `localhost`

**Dispositivo físico**:
- Use o IP da sua máquina na mesma rede Wi-Fi
- Descobrir IP:
  - Windows: `ipconfig`
  - Linux: `ip addr show` ou `ifconfig`

### Metro Bundler com cache desatualizado

```bash
# Windows
npm start -- --reset-cache

# Linux
npm start -- --reset-cache
```

### Android build falha

```bash
# Limpar cache
cd android
./gradlew clean  # Linux
.\gradlew clean  # Windows
cd ..

# Reinstalar node_modules
rm -rf node_modules  # Linux
rmdir /s node_modules  # Windows
npm install
```

### Permissões negadas (Linux)

```bash
# Dar permissão ao gradlew
chmod +x android/gradlew

# Dar permissão aos scripts
chmod +x node_modules/.bin/*
```

---

## 👥 Contato e Contribuição

**Desenvolvedor**: Douglas Medeiros  
**Empresa**: Neo Reformata  
**Disciplina**: Programação de Dispositivos Móveis I

---

## 📄 Licença

Este projeto está sendo desenvolvido como trabalho acadêmico e pode ser utilizado pela Neo Reformata como produto comercial.

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Funcional - Em desenvolvimento ativo
