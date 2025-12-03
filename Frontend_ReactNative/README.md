# Mobile Marketplace Services - React Native Frontend

Frontend mobile application for the Mobile Marketplace Services platform, connecting clients and service providers through a mobile interface with real-time features.

## 📱 Features Implemented

### ✅ Phase 1: Foundation (Complete)
- Project setup with TypeScript and React Native 0.82
- Environment configuration (.env)
- Folder structure and architecture
- TypeScript type definitions
- Dependency installation

### ✅ Phase 2: Core Infrastructure (Complete)
- AsyncStorage wrapper for token/user persistence
- Axios HTTP client with JWT interceptors
- API service modules (auth, user, services, proposals, chat, quick-service)
- Authentication Context (login, register, logout, token validation)
- WebSocket Context (auto-reconnect, message handling)

### ✅ Phase 3: Navigation (Complete)
- React Navigation setup (Stack + Bottom Tabs)
- Auth Navigator (Login, Register, ForgotPassword)
- Main Navigator with role-based tab visibility
- Nested stack navigators for each feature

### ✅ Phase 4: Authentication Screens (Complete)
- Login screen with email/password
- Register screen with role selection (cliente/prestador)
- Forgot Password flow with recovery code
- Auto-login after registration
- Token persistence and validation on app start

### ✅ Phase 5: Basic Screens (Prototype)
- Services List (Home) with pull-to-refresh
- Profile screen with user info and logout
- Placeholder screens for remaining features

### 🚧 Phase 6: In Progress
- Service Detail screen with proposals
- Create Service form
- Proposals management
- Real-time Chat interface
- Quick Service matching flow
- Complete geolocation integration

## 🛠️ Tech Stack

- React Native 0.82.1
- TypeScript 5.8.3
- React Navigation 6.x
- Context API (state management)
- AsyncStorage (persistence)
- Axios (HTTP client)
- WebSocket (real-time)
- Formik + Yup (forms)
- date-fns (dates)
- react-native-geolocation-service
- react-native-vector-icons

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- Android Studio + Android SDK (for Android)
- Xcode + CocoaPods (for iOS, macOS only)

### Installation

```bash
# 1. Navigate to frontend directory
cd Frontend_ReactNative

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your backend URL

# 4. iOS only - Install pods
cd ios && pod install && cd ..

# 5. Start Metro bundler
npm start

# 6. Run on Android (separate terminal)
npm run android

# 7. Run on iOS (separate terminal, macOS only)
npm run ios
```

### Environment Configuration

Create `.env` file:

```env
API_BASE_URL=http://localhost:3000
WS_BASE_URL=ws://localhost:3000
NODE_ENV=development
```

**Important for Android Emulator**: Use `http://10.0.2.2:3000` instead of `localhost`

## 📡 API Integration

### Authentication

```typescript
import {useAuth} from './contexts/AuthContext';

const {login, register, logout, user, isAuthenticated} = useAuth();

// Login
await login({email: 'user@example.com', senha: 'password'});

// Register
await register({
  nome: 'John Doe',
  email: 'john@example.com',
  senha: 'password123',
  cpf: '12345678900',
  role: 'cliente', // or 'prestador'
});

// Logout
await logout();
```

### API Services

```typescript
import {servicesService} from './api/services/servicesService';

// Get all services
const services = await servicesService.getServices();

// Create service
const service = await servicesService.createService({
  nome: 'Service Name',
  valor_minimo: 100,
  valor_maximo: 300,
  data_fim: '2025-12-31T23:59:59Z',
  category_id: 1,
});
```

### WebSocket

```typescript
import {useWebSocket} from './contexts/WebSocketContext';

const {connectionStatus, sendMessage, addMessageHandler} = useWebSocket();

// Listen for messages
useEffect(() => {
  const unsubscribe = addMessageHandler((message) => {
    if (message.type === 'new_message') {
      console.log('New chat message:', message.data);
    }
  });
  return unsubscribe;
}, []);

// Send message
sendMessage({
  type: 'send_message',
  otherUserId: 10,
  message: 'Hello!',
});
```

## 📁 Project Structure

```
src/
├── api/
│   ├── client.ts                   # Axios config + interceptors
│   └── services/                   # API modules
│       ├── authService.ts
│       ├── servicesService.ts
│       ├── proposalsService.ts
│       ├── chatService.ts
│       └── quickServiceService.ts
├── contexts/
│   ├── AuthContext.tsx             # Auth state management
│   └── WebSocketContext.tsx        # WebSocket management
├── navigation/
│   ├── AppNavigator.tsx            # Root navigator
│   ├── AuthNavigator.tsx           # Auth screens
│   └── MainNavigator.tsx           # Main app (tabs + stacks)
├── pages/
│   ├── auth/                       # Login, Register, ForgotPassword
│   ├── services/                   # Services screens
│   ├── proposals/                  # Proposals screens
│   ├── chat/                       # Chat screens
│   ├── quickService/               # Quick service screens
│   └── profile/                    # Profile screens
├── types/
│   ├── api.types.ts                # API response types
│   ├── navigation.types.ts         # Navigation types
│   └── env.d.ts                    # Environment types
└── utils/
    └── storage.ts                  # AsyncStorage wrapper
```

## 🔌 Backend Endpoints Used

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (returns JWT)
- `POST /auth/logout` - Token blacklisting
- `GET /auth/me` - Get current user
- `POST /auth/password/forgot` - Request recovery code
- `POST /auth/password/reset` - Reset password

### Services
- `GET /services` - List all services
- `GET /services/:id` - Get service details
- `POST /services` - Create service (cliente)
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### Proposals
- `GET /proposals/service/:serviceId` - Get proposals for service
- `GET /proposals/my` - Get prestador's proposals
- `POST /proposals` - Create proposal (prestador)
- `PATCH /proposals/:id/status` - Update status
- `DELETE /proposals/:id` - Delete proposal

### Chat
- `GET /chat/rooms` - List conversations
- `GET /chat/messages/:otherUserId` - Get history
- `POST /chat/messages` - Send message (REST fallback)
- WebSocket: `ws://host/chat?token=xxx`

### Quick Service
- `PUT /user/me/quick-availability` - Update availability
- `POST /quick-service/request` - Request quick service
- WebSocket messages: `quick_service_request`, `quick_service_response`, `quick_service_matched`

## 🐛 Troubleshooting

### Cannot connect to backend

**Android Emulator**: Use `10.0.2.2` instead of `localhost` in `.env`

**iOS Simulator**: Use your machine's IP address

### Metro bundler issues

```bash
npm start -- --reset-cache
```

### Android build fails

```bash
cd android
./gradlew clean
cd ..
```

### iOS build fails

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🔒 Security

- JWT tokens stored in AsyncStorage
- Tokens auto-injected in API requests
- Auto-logout on 401 responses
- Passwords never persisted
- HTTPS recommended for production

## 📚 Backend Documentation

- [API Documentation](../Backend/Server/API-DOCUMENTATION.md)
- [Chat Documentation](../Backend/Server/CHAT-DOCUMENTATION.md)
- [Quick Service Documentation](../Backend/Server/QUICK-SERVICE-README.md)

## 🎯 Next Steps

1. Complete Service Detail screen with proposals list
2. Implement Create Service form with validation
3. Build proposals management (accept/reject)
4. Complete real-time chat interface
5. Implement Quick Service matching flow
6. Add geolocation integration
7. Enhance error handling and offline support
8. Add loading states and animations
9. Implement search and filters
10. Write comprehensive tests

## 👥 User Roles

- **Cliente**: Create services, accept proposals, request quick services
- **Prestador**: Submit proposals, activate availability, receive quick service notifications
- **Admin**: Full platform access

## 📝 Current Limitations

- Push notifications not implemented (documented limitation)
- Image uploads not supported (backend limitation)
- Single environment configuration
- Performance optimization deferred

---

**Status**: ✅ Foundation Complete - Ready for Feature Development  
**Version**: 1.0.0  
**Last Updated**: November 30, 2025
