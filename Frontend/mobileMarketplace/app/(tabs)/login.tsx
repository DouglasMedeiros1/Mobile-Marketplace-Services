

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
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      let body;
      try {
        body = await res.json();
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, pega o texto da resposta
        const textResponse = await res.text();
        console.error('Erro ao fazer parse do JSON:', textResponse);
        throw new Error(`Erro do servidor (${res.status}): ${textResponse.substring(0, 100)}...`);
      }
      
      if (!res.ok) {
        // backend pode retornar mensagem de erro em body.message
        const msg = body?.message || body?.error || `Erro ${res.status}`;
        throw new Error(msg);
      }

      const token = body?.token;
      if (!token) throw new Error('Resposta do servidor não contém token');

      await AsyncStorage.setItem('token', token);
      // navega para a tela principal removendo a tela de login da stack
      navigation.reset({ index: 0, routes: [{ name: 'index' }] });
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
      // Validação dos campos obrigatórios
      if (!nome || !email || !senha || !cpf) {
        setError('Nome, email, senha e CPF são obrigatórios');
        setLoading(false);
        return;
      }

      const payload: any = { nome, email, senha, cpf };
      if (telefone) payload.telefone = telefone;
      if (cidade) payload.cidade = cidade;
      if (estado) payload.estado = estado;

      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let body;
      try {
        body = await res.json();
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, pega o texto da resposta
        const textResponse = await res.text();
        console.error('Erro ao fazer parse do JSON:', textResponse);
        throw new Error(`Erro do servidor (${res.status}): ${textResponse.substring(0, 100)}...`);
      }
      
      if (!res.ok) {
        const msg = body?.message || body?.error || `Erro ${res.status}`;
        throw new Error(msg);
      }

      // muitos backends retornam token logo após registro
      const token = body?.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        navigation.reset({ index: 0, routes: [{ name: 'index' }] });
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
            <TextInput placeholder="CPF" value={cpf} onChangeText={setCpf} style={styles.input} keyboardType="numeric" />
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

