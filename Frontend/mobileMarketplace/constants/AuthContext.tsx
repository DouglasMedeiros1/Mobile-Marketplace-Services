// constants/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { login, register } from '../api/authService'; 
// import { login, register } from '../api/authService'; // Se quiser o register

// 1. Definição do Tipo (Interface) para o Conteúdo do Contexto
interface AuthContextType {
  user: any; // Mantenha 'any' ou defina um tipo 'User' aqui
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: any) => Promise<void>; 
  isLoading: boolean;
}

// 2. Criar o Contexto
// Passamos 'null as any' ou um valor padrão que corresponda à interface
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Hook para facilitar o uso do contexto (Correção do Erro: useAuth não exportado)
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// 4. Provedor (Provider)
// constants/AuthContext.tsx

// ... imports e AuthContextType (presumindo que estão corretos)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null); 
    const [isLoading, setIsLoading] = useState(true);
    const USER_ID_KEY = 'user_id'; 
    const USER_EMAIL_KEY = 'user_email'; // Opcional, mas útil
    const TOKEN_KEY = 'user_auth_token'; 
  
    // --- Função signIn (correta) ---
    const signIn = async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const { token, user: userData } = await login(email, password);
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_ID_KEY, String(userData.id)); // ⬅️ SALVANDO O ID
        await AsyncStorage.setItem(USER_EMAIL_KEY, userData.email); 
        setUser(userData);
      } catch (error: unknown) {
        console.error('Erro no login:', error);
        throw error; 
      } finally {
        setIsLoading(false); // Fim do carregamento APÓS A TENTATIVA DE LOGIN MANUAL
      }
    };
  
    // --- Função signOut (correta) ---
    const signOut = async (): Promise<void> => {
      setUser(null);
      await AsyncStorage.removeItem(TOKEN_KEY);  
      await AsyncStorage.removeItem(USER_ID_KEY); 
      await AsyncStorage.removeItem(USER_EMAIL_KEY);
      
      router.replace('/login');
    };

    // 🚨 FUNÇÃO signUp FALTANTE (ADICIONE ESTE BLOCO)
    const signUp = async (data: any): Promise<void> => {
        setIsLoading(true);
        try {
          // 1. Chama a rota de registro
          await register(data);
          
          // 2. Após o registro, faz login automaticamente
          // O signIn já está definido logo acima, então é só chamar
          await signIn(data.email, data.password);
          
        } catch (error: unknown) {
          console.error('Erro no registro:', error);
          throw error;
        } finally {
          // O finally do signIn também fará isso, mas é bom garantir aqui
          setIsLoading(false);
        }
      };
      
    
    // ⚠️ LÓGICA DE CARREGAMENTO INICIAL: ESSA É A PARTE QUE FALTAVA!
    useEffect(() => {
      const loadToken = async () => {
        try {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const id = await AsyncStorage.getItem(USER_ID_KEY); 
          const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
          
          if (token && id && email) {
            setUser({ id: Number(id), email: email }); // Define user com ID e email
          }
        } catch (e) {
          console.error("Falha ao carregar token:", e);
        } finally {
          // 🚨 ESTA LINHA É CRUCIAL E DEVE SER CHAMADA SEMPRE NA INICIALIZAÇÃO
          setIsLoading(false); 
        }
      };
      
      loadToken();
    }, []); // [] garante que roda apenas na montagem
  
    // --- Restante do Contexto ---
    const authContextValue: AuthContextType = {
      user,
      signIn,
      signOut,
      signUp,
      isLoading
    };
  
    return (
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    );
  }