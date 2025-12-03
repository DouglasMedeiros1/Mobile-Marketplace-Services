import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import type {AuthNavigationProp} from '../../types/navigation.types';
import {useNavigation} from '@react-navigation/native';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const {register} = useAuth();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<'cliente' | 'prestador'>('cliente');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nome || !email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register({
        nome,
        email,
        senha,
        telefone,
        role,
      });
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      // Error is handled in AuthContext with Alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Criar Conta</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Tipo de Conta *</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'cliente' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('cliente')}
                disabled={loading}>
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'cliente' && styles.roleButtonTextActive,
                  ]}>
                  Cliente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'prestador' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('prestador')}
                disabled={loading}>
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'prestador' && styles.roleButtonTextActive,
                  ]}>
                  Prestador
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="João Silva"
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />

            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}>
              <Text style={styles.linkText}>Já tem uma conta? Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  roleButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  roleButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 14,
  },
});

export default RegisterScreen;
