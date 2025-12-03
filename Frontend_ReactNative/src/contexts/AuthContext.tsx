import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import {Alert} from 'react-native';
import {authService} from '../api/services/authService';
import {storage} from '../utils/storage';
import type {
  User,
  LoginRequest,
  RegisterRequest,
} from '../types/api.types';

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load stored credentials and validate token on app start
   */
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('Loading stored auth...');
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser();

      console.log('Stored token exists:', !!storedToken);
      console.log('Stored user exists:', !!storedUser);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Validate token by fetching current user
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          await storage.saveUser(currentUser);
        } catch (error) {
          console.log('Token validation failed, clearing storage');
          // Token invalid, clear storage
          await storage.clearAll();
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);
      
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData);
      
      await storage.saveToken(response.token);
      await storage.saveUser(response.user);
      
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      Alert.alert('Registration Error', error.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend to blacklist token
      await authService.logout();
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
    } finally {
      // Clear local storage regardless of API result
      await storage.clearAll();
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      await storage.saveUser(currentUser);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to refresh user data');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
