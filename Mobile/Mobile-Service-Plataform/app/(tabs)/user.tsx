import React, { useState } from 'react';
import { StyleSheet, View, Switch, Pressable, Alert, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/contexts/I18nContext';
import { useThemeLocal } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

export default function UserScreen() {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useThemeLocal();
  const { user, logout, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
  });

  const isDark = theme === 'dark';

  const handleLogout = () => {
    Alert.alert(
      t('user.options.logout'),
      'Tem certeza que deseja sair?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('user.options.logout'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleUpdateUser = async () => {
    try {
      const result = await updateUser(editData);
      if (result.success) {
        Alert.alert(t('common.success'), 'Dados atualizados com sucesso!');
        setShowEditModal(false);
      } else {
        Alert.alert(t('common.error'), result.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Erro ao atualizar dados');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      gap: 16,
    },
    userInfo: {
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? Colors.dark.text : Colors.light.text,
    },
    userEmail: {
      fontSize: 14,
      color: isDark ? Colors.dark.text : Colors.light.text,
      opacity: 0.7,
      marginTop: 4,
    },
    logoutButton: {
      backgroundColor: '#ff4444',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: isDark ? Colors.dark.text : Colors.light.text,
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
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    cancelButton: {
      backgroundColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
    },
    saveButton: {
      backgroundColor: Colors[theme].tint,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('screens.userTitle')}</ThemedText>
      <ThemedText>{t('screens.userSubtitle')}</ThemedText>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user?.nome}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.cidade && user?.estado && (
          <Text style={styles.userEmail}>{user.cidade}, {user.estado}</Text>
        )}
      </View>

      <Section title={t('user.sections.account')}>
        <RowButton 
          label={t('user.options.editData')} 
          onPress={() => setShowEditModal(true)}
        />
      </Section>

      <Section title={t('user.sections.customization')}>
        <RowSwitch 
          label={t('user.options.theme')} 
          value={theme === 'light'} 
          onChange={toggleTheme} 
        />
        <RowSwitch
          label={t('user.options.language')}
          value={language === 'en'}
          onChange={() => setLanguage(language === 'en' ? 'pt' : 'en')}
        />
      </Section>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('user.options.logout')}</Text>
      </TouchableOpacity>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>{t('user.options.editData')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('auth.name')}
              value={editData.nome}
              onChangeText={(text) => setEditData({ ...editData, nome: text })}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.phone')}
              value={editData.telefone}
              onChangeText={(text) => setEditData({ ...editData, telefone: text })}
              keyboardType="phone-pad"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.city')}
              value={editData.cidade}
              onChangeText={(text) => setEditData({ ...editData, cidade: text })}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('auth.state')}
              value={editData.estado}
              onChangeText={(text) => setEditData({ ...editData, estado: text })}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.buttonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateUser}
              >
                <Text style={styles.buttonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ThemedView style={{ gap: 8 }}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedView style={{ gap: 8 }}>{children}</ThemedView>
    </ThemedView>
  );
}

function RowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 12 }}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
    </Pressable>
  );
}

function RowSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <ThemedText>{label}</ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}


