// app/(tabs)/profile.tsx - VERSÃO SOMENTE LOGOUT

import React from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../constants/AuthContext';
// Removendo imports desnecessários: getUserMe, updateUser, logoutUser
import { logoutUser } from '../../api/authService'; 

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  // Função de Logout (Mantida)
  const handleLogout = async () => {
    try {
      // Tenta invalidar o token no servidor
      await logoutUser(); 
      signOut(); // Limpa o estado local
    } catch (error) {
      // Se a falha for apenas no servidor (ex: Render inativo), deslogamos localmente.
      console.error("Falha no logout do servidor, deslogando localmente:", error);
      signOut(); 
      Alert.alert("Logout", "Sessão encerrada, mas houve um erro de comunicação com o servidor.");
    }
  };
  
  // Exibição simples dos dados principais (se existirem), mas sem formulário.
  const userEmail = user?.email || 'Usuário Desconhecido';
  const userName = user?.nome || 'Perfil';

  return (
    <View style={styles.container}>
      {/* Define o título do header */}
      <Stack.Screen options={{ title: 'Meu Perfil' }} />

      <Text style={styles.header}>Bem vindo a Mobile-Marketplace!</Text>
      <Text style={styles.email}>Você ja está logao, deseja sair de sua conta?</Text>
      
      <View style={styles.separator} />

      {/* --- BOTÃO LOGOUT --- */}
      <Button 
        title="Sair da Conta (Logout)" 
        onPress={handleLogout} 
        color="red"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', // Centraliza o conteúdo
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    backgroundColor: '#eee',
  }
});