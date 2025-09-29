// app/login.tsx (Versão Atualizada para Login E Registro)

import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Text, Alert, ScrollView } from 'react-native';
import { useAuth } from '../constants/AuthContext'; // Ajuste o caminho

// Tipagem dos dados de registro
interface RegisterData {
  nome: string;
  email: string;
  password: string;
  telefone: string;
  cidade: string;
  estado: string;
  cpf: string;
}

export default function AuthScreen() {
  const { signIn, signUp, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // Alterna entre Login e Registro
  
  // Estado para LOGIN
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estado para REGISTRO (Todos os campos necessários pelo seu servidor)
  const [registerData, setRegisterData] = useState<RegisterData>({
    nome: '', email: '', password: '', telefone: '', cidade: '', estado: '', cpf: ''
  });

  // Função genérica para atualizar os campos do registro
  const handleRegisterChange = (key: keyof RegisterData, value: string) => {
    setRegisterData(prev => ({ ...prev, [key]: value }));
  };

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Erro", "Por favor, preencha email e senha.");
      return;
    }
    try {
      await signIn(loginEmail, loginPassword);
    } catch (error: any) {
      Alert.alert("Erro de Login", error.message || "Falha ao conectar.");
    }
  };

  // --- LÓGICA DE REGISTRO ---
  const handleRegister = async () => {
    const requiredFields: Array<keyof RegisterData> = ['nome', 'email', 'password', 'cpf'];

    // Verificação dos campos obrigatórios (conforme seu backend)
    for (const field of requiredFields) {
        if (!registerData[field]) {
            Alert.alert("Erro", `O campo '${field}' é obrigatório.`);
            return;
        }
    }
    
    try {
      // Chama a função signUp que faz o registro e depois o login
      await signUp(registerData);
      Alert.alert("Sucesso", "Cadastro realizado! Você está logado.");
    } catch (error: any) {
      Alert.alert("Erro de Cadastro", error.message || "Falha ao registrar.");
    }
  };

  // --- COMPONENTES AUXILIARES ---

  const renderLogin = () => (
    <>
      <Text style={styles.header}>Fazer Login</Text>

      <TextInput style={styles.input} placeholder="Email" value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />

      <Button title={isLoading ? "Entrando..." : "Entrar"} onPress={handleLogin} disabled={isLoading} />
    </>
  );

  const renderRegister = () => (
    <>
      <Text style={styles.header}>Criar Conta</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* CAMPOS OBRIGATÓRIOS */}
        {['nome', 'email', 'password', 'cpf'].map(key => (
            <TextInput
                key={key}
                style={styles.input}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1) + (key === 'password' ? ' (mínimo 6 caracteres)' : key === 'cpf' ? ' (obrigatório)' : '')}
                value={registerData[key as keyof RegisterData]}
                onChangeText={(text) => handleRegisterChange(key as keyof RegisterData, text)}
                secureTextEntry={key === 'password'}
                keyboardType={key === 'cpf' ? 'numeric' : key === 'email' ? 'email-address' : 'default'}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
            />
        ))}

        {/* CAMPOS OPCIONAIS (Se o servidor aceita null, podemos deixar opcional) */}
        {['telefone', 'cidade', 'estado'].map(key => (
            <TextInput
                key={key}
                style={styles.input}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1) + ' (Opcional)'}
                value={registerData[key as keyof RegisterData]}
                onChangeText={(text) => handleRegisterChange(key as keyof RegisterData, text)}
                keyboardType={key === 'telefone' ? 'numeric' : 'default'}
                autoCapitalize='words'
            />
        ))}
      </ScrollView>

      <Button title={isLoading ? "Cadastrando..." : "Registrar"} onPress={handleRegister} disabled={isLoading} />
    </>
  );

  return (
    <View style={styles.container}>
      {isLogin ? renderLogin() : renderRegister()}

      <View style={styles.separator} />

      <Button
        title={isLogin ? "Ainda não tenho conta" : "Já tenho conta (Voltar)"}
        onPress={() => setIsLogin(!isLogin)}
        color="#336699"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    backgroundColor: '#eee',
  },
});