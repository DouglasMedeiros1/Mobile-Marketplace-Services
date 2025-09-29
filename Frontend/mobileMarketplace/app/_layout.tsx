// app/_layout.tsx

import { Stack, useSegments, router } from 'expo-router';
import { AuthProvider, useAuth } from '../constants/AuthContext';
import { useEffect } from 'react';
import { Text } from 'react-native'; // Importe Text para a tela de carregamento

// --- HOOK DE ROTEAMENTO CONDICIONAL ---
function useProtectedRoute(user: any, isLoading: boolean) {
  const segments = useSegments(); 
  const inAuthGroup = segments[0] === '(tabs)'; // Verifica se estamos em uma rota protegida

  useEffect(() => {
    // 1. Não faça nada enquanto carrega o estado inicial (ex: AsyncStorage)
    if (isLoading) return; 

    const isLoginScreen = segments[0] === 'login'; // Verifica se a rota atual é 'login'

    // 2. Lógica de Redirecionamento
    if (!user && inAuthGroup) {
      // Se NÃO tem usuário E está tentando acessar uma rota protegida (tabs), vá para o login.
      router.replace('/login');
    } else if (user && isLoginScreen) {
      // Se TEM usuário E está na tela de login, vá para as abas.
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]); 
  // O useEffect reage quando 'user' muda (sucesso no login), e faz o redirecionamento.
}

// --- LAYOUT PRINCIPAL DO APP ---

export default function RootLayout() {
  // ⚠️ Passo 1: Envolver tudo com o AuthProvider
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth(); // Pega o estado
  
  // ⚠️ Passo 2: Executar a Proteção de Rota
  useProtectedRoute(user, isLoading);
  
  // Exibir tela de carregamento (útil para o primeiro boot)
  if (isLoading) {
    return (
        <Text style={{ flex: 1, textAlign: 'center', paddingTop: 100 }}>
            Carregando App...
        </Text>
    );
  }

  // ⚠️ Passo 3: Definir a Stack de Rotas
  return (
    <Stack>
      {/* Rota para o seu App principal (protegida pelo useProtectedRoute) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Rota de Login (Não Protegida) */}
      <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Entrar' }} />
      
      {/* Certifique-se de que a rota de login TEM esse nome */}
    </Stack>
  );
}