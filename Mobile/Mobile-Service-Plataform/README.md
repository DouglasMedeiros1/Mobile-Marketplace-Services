# Mobile Service Platform

Um aplicativo mobile para marketplace de serviços, desenvolvido com React Native e Expo.

## 🚀 Funcionalidades

### Autenticação
- **Login/Registro**: Sistema completo de autenticação com validação
- **Proteção de rotas**: Acesso bloqueado para usuários não autenticados
- **Persistência de sessão**: Login mantido entre sessões do app

### Navegação
- **Barra de navegação inferior** com 3 abas:
  - **Feed**: Visualização de todos os serviços disponíveis
  - **Serviços**: Gerenciamento dos próprios serviços
  - **Usuário**: Configurações e perfil

### Feed de Serviços
- **Cards de serviços**: Exibição de todos os serviços em formato de cards
- **Informações detalhadas**: Nome, descrição, valores, data e usuário
- **Pull-to-refresh**: Atualização dos dados puxando para baixo
- **Navegação para detalhes**: Toque no card para ver detalhes completos

### Gerenciamento de Serviços
- **Criação de serviços**: Formulário completo para criar novos serviços
- **Lista de serviços próprios**: Visualização dos serviços criados pelo usuário
- **Edição e exclusão**: Gerenciamento completo dos serviços
- **Validação de dados**: Validação de campos obrigatórios e valores

### Perfil do Usuário
- **Informações do usuário**: Exibição de dados pessoais
- **Edição de dados**: Modal para editar informações pessoais
- **Logout**: Saída segura do sistema
- **Configurações de tema**: Alternância entre modo claro e escuro
- **Configurações de idioma**: Alternância entre português e inglês

### Internacionalização
- **Suporte a idiomas**: Português e Inglês
- **Tradução completa**: Todas as interfaces traduzidas
- **Persistência de preferência**: Idioma mantido entre sessões

### Temas
- **Modo claro e escuro**: Alternância entre temas
- **Persistência de preferência**: Tema mantido entre sessões
- **Interface adaptativa**: Cores e estilos adaptados ao tema

## 🛠️ Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento mobile
- **Expo**: Plataforma de desenvolvimento e deploy
- **TypeScript**: Tipagem estática para JavaScript
- **Expo Router**: Navegação baseada em arquivos
- **AsyncStorage**: Armazenamento local de dados
- **Axios**: Cliente HTTP para comunicação com API
- **Context API**: Gerenciamento de estado global

## 📱 Estrutura do Projeto

```
app/
├── _layout.tsx          # Layout principal com providers
├── auth.tsx             # Tela de login/registro
├── (tabs)/              # Navegação por abas
│   ├── _layout.tsx      # Layout das abas
│   ├── index.tsx        # Feed de serviços
│   ├── services.tsx     # Gerenciamento de serviços
│   └── user.tsx         # Perfil do usuário
└── service/
    └── [id].tsx         # Detalhes do serviço

contexts/
├── AuthContext.tsx      # Contexto de autenticação
├── I18nContext.tsx      # Contexto de internacionalização
└── ThemeContext.tsx     # Contexto de temas

services/
└── api.ts               # Serviço de comunicação com API
```

## 🔧 Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Dispositivo móvel com Expo Go ou emulador

### Instalação
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure a URL da API no arquivo `services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://seu-backend-url:porta';
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

5. Escaneie o QR code com o Expo Go ou execute no emulador

## 🔌 Integração com Backend

O aplicativo está configurado para se comunicar com uma API REST que deve implementar os seguintes endpoints:

### Autenticação (`/auth`)
- `POST /auth/login` - Login do usuário
- `POST /auth/register` - Registro de usuário
- `POST /auth/logout` - Logout (requer token)
- `GET /auth/me` - Dados do usuário logado (requer token)

### Usuários (`/users`)
- `GET /users` - Lista todos os usuários
- `PUT /users/:id` - Atualiza usuário (requer token)

### Serviços (`/services`)
- `GET /services` - Lista todos os serviços
- `POST /services` - Cria novo serviço (requer token)
- `GET /services/:id` - Obtém serviço específico
- `PUT /services/:id` - Atualiza serviço (requer token)
- `DELETE /services/:id` - Exclui serviço (requer token)

## 🎨 Personalização

### Temas
Os temas podem ser personalizados editando o arquivo `constants/theme.ts`.

### Traduções
As traduções podem ser adicionadas/editadas no arquivo `contexts/I18nContext.tsx`.

### Estilos
Os estilos são definidos inline em cada componente, seguindo o padrão do React Native.

## 📱 Funcionalidades por Tela

### Tela de Login/Registro
- Validação de campos obrigatórios
- Validação de formato de email
- Confirmação de senha no registro
- Feedback visual de erros e sucessos
- Alternância entre login e registro

### Feed de Serviços
- Carregamento automático dos serviços
- Pull-to-refresh para atualizar
- Cards responsivos com informações essenciais
- Navegação para detalhes do serviço
- Estado de loading e erro

### Gerenciamento de Serviços
- Modal de criação com validação
- Lista de serviços próprios
- Ações de edição e exclusão
- Confirmação de exclusão
- Feedback de sucesso/erro

### Perfil do Usuário
- Exibição de informações pessoais
- Modal de edição com validação
- Configurações de tema e idioma
- Botão de logout com confirmação
- Persistência de preferências

## 🔒 Segurança

- Tokens JWT para autenticação
- Armazenamento seguro de credenciais
- Validação de dados no frontend
- Proteção de rotas sensíveis
- Logout automático em caso de erro de autenticação

## 🚀 Deploy

Para fazer deploy do aplicativo:

1. Configure as variáveis de ambiente
2. Execute o build:
   ```bash
   expo build:android
   # ou
   expo build:ios
   ```

3. Siga as instruções do Expo para publicação

## 📝 Notas de Desenvolvimento

- O aplicativo usa Context API para gerenciamento de estado
- Todas as requisições HTTP são centralizadas no serviço de API
- O armazenamento local é usado para persistir sessões e preferências
- A navegação é baseada em arquivos usando Expo Router
- Os temas e idiomas são aplicados globalmente através de contextos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.