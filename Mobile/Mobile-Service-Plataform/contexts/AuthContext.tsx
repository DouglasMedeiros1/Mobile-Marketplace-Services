import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  cpf?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  cpf: string;
  telefone: string;
  cidade: string;
  estado: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiService.login(email, password);
      setToken(data.token);
      setUser(data.user);
      
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erro no login' };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await apiService.register(userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erro no cadastro' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        apiService.setToken(token);
        await apiService.logout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!token || !user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      apiService.setToken(token);
      const data = await apiService.updateUser(user.id, userData);
      
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erro ao atualizar usuário' };
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
