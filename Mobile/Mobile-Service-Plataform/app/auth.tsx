import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';
import { useThemeLocal } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { t } = useTranslation();
  const { theme } = useThemeLocal();

  const isDark = theme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('common.required'));
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('auth.loginError'));
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !phone || !cpf || !city || !state) {
      Alert.alert(t('common.error'), t('common.required'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('common.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('common.passwordTooShort'));
      return;
    }

    setLoading(true);
    const result = await register({
      nome: name,
      email,
      password,
      telefone: phone,
      cpf,
      cidade: city,
      estado: state,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(t('common.success'), t('auth.registerSuccess'), [
        { text: t('common.confirm'), onPress: () => setIsLogin(true) }
      ]);
    } else {
      Alert.alert(t('common.error'), result.error || t('auth.registerError'));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: isDark ? Colors.dark.text : Colors.light.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      color: isDark ? Colors.dark.text : Colors.light.text,
      opacity: 0.7,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
      color: isDark ? Colors.dark.text : Colors.light.text,
    },
    button: {
      backgroundColor: Colors[theme].tint,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    switchButton: {
      alignItems: 'center',
      padding: 12,
    },
    switchButtonText: {
      color: Colors[theme].tint,
      fontSize: 16,
    },
    loadingText: {
      textAlign: 'center',
      color: isDark ? Colors.dark.text : Colors.light.text,
      marginTop: 16,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
        </Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder={t('auth.name')}
            value={name}
            onChangeText={setName}
            placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
        />

        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.cpf')}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.city')}
              value={city}
              onChangeText={setCity}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.state')}
              value={state}
              onChangeText={setState}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isLogin ? handleLogin : handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.loading') : (isLogin ? t('auth.login') : t('auth.register'))}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


