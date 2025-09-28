/*
  Arquivos criados aqui (cole no seu projeto):
  - src/screens/LoginScreen.tsx   (este componente: tela de login / registro)
  - App.tsx                       (exemplo de integração com react-navigation e AsyncStorage)

  Notas rápidas:
  - Endpoints usados:
    * Login:    https://mobile-marketplace-server-1-0-sgvh.onrender.com/login
    * Register: https://mobile-marketplace-server-1-0-sgvh.onrender.com/register
  - Ao logar/registrar o token retornado é salvo em AsyncStorage sob a chave 'token'.
  - Em produção use armazenamento seguro (Keychain / EncryptedStorage) em vez de AsyncStorage.
  - Este exemplo assume que o backend retorna JSON com campo { token: string } ao logar.

  Dependências que você precisa instalar (Expo / React Native):
    npm install @react-navigation/native @react-navigation/stack @react-native-async-storage/async-storage
    npm install react-native-gesture-handler react-native-screens
    # depois siga a configuração do react-navigation (ver docs) para gesture-handler/native-stack se necessário
*/

// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'https://mobile-marketplace-server-1-0-sgvh.onrender.com';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // campos
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const body = await res.json();
      if (!res.ok) {
        // backend pode retornar mensagem de erro em body.message
        const msg = body?.message || `Erro ${res.status}`;
        throw new Error(msg);
      }

      const token = body?.token;
      if (!token) throw new Error('Resposta do servidor não contém token');

      await AsyncStorage.setItem('token', token);
      // navega para a tela principal removendo a tela de login da stack
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: any) {
      setError(err.message ?? 'Erro ao logar');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const payload: any = { nome, email, senha };
      if (telefone) payload.telefone = telefone;
      if (cidade) payload.cidade = cidade;
      if (estado) payload.estado = estado;

      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        const msg = body?.message || `Erro ${res.status}`;
        throw new Error(msg);
      }

      // muitos backends retornam token logo após registro
      const token = body?.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        return;
      }

      // se não houve token, apenas informar para logar
      Alert.alert('Cadastro realizado', 'Cadastro concluído com sucesso. Faça login.');
      setMode('login');
    } catch (err: any) {
      setError(err.message ?? 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Entrar' : 'Cadastrar'}</Text>

        {mode === 'register' && (
          <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
        )}

        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput placeholder="Senha" value={senha} onChangeText={setSenha} style={styles.input} secureTextEntry />

        {mode === 'register' && (
          <>
            <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} style={styles.input} keyboardType="phone-pad" />
            <TextInput placeholder="Cidade" value={cidade} onChangeText={setCidade} style={styles.input} />
            <TextInput placeholder="Estado" value={estado} onChangeText={setEstado} style={styles.input} />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title={mode === 'login' ? 'Entrar' : 'Cadastrar'} onPress={mode === 'login' ? handleLogin : handleRegister} />
        )}

        <View style={{ height: 12 }} />
        <Button title={mode === 'login' ? 'Criar conta' : 'Já tenho conta'} onPress={() => setMode(mode === 'login' ? 'register' : 'login')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  card: { width: '92%', backgroundColor: '#fff', padding: 16, borderRadius: 10, shadowOpacity: 0.05, elevation: 2 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginBottom: 8 },
  error: { color: 'red', marginBottom: 8 },
});

