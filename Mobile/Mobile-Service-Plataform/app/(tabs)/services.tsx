import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/contexts/I18nContext';
import { useThemeLocal } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Service, CreateServiceData } from '@/services/api';
import { Colors } from '@/constants/theme';

export default function ServicesScreen() {
  const { t } = useTranslation();
  const { theme } = useThemeLocal();
  const { user, token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateServiceData>({
    nome: '',
    descricao: '',
    valor_minimo: 0,
    valor_maximo: 0,
    data_inicio: '',
    categoria_id: 1,
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
      loadMyServices();
    }
  }, [token]);

  const loadMyServices = async () => {
    try {
      const allServices = await apiService.getServices();
      const myServices = allServices.filter(service => service.usuario_id === user?.id);
      setServices(myServices);
    } catch (error) {
      Alert.alert(t('common.error'), 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!formData.nome || !formData.descricao || !formData.data_inicio) {
      Alert.alert(t('common.error'), t('common.required'));
      return;
    }

    if (formData.valor_minimo >= formData.valor_maximo) {
      Alert.alert(t('common.error'), 'Valor mínimo deve ser menor que o máximo');
      return;
    }

    try {
      await apiService.createService(formData);
      Alert.alert(t('common.success'), t('services.createSuccess'));
      setShowCreateModal(false);
      setFormData({
        nome: '',
        descricao: '',
        valor_minimo: 0,
        valor_maximo: 0,
        data_inicio: '',
        categoria_id: 1,
      });
      loadMyServices();
    } catch (error) {
      Alert.alert(t('common.error'), t('services.createError'));
    }
  };

  const handleDeleteService = async (id: number) => {
    Alert.alert(
      t('common.confirm'),
      'Tem certeza que deseja excluir este serviço?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteService(id);
              Alert.alert(t('common.success'), t('services.deleteSuccess'));
              loadMyServices();
            } catch (error) {
              Alert.alert(t('common.error'), t('services.deleteError'));
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    createButton: {
      backgroundColor: Colors[theme].tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    createButtonText: {
      color: 'white',
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
    textArea: {
      height: 80,
      textAlignVertical: 'top',
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
    serviceCard: {
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    serviceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? Colors.dark.text : Colors.light.text,
      flex: 1,
    },
    deleteButton: {
      backgroundColor: '#ff4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    deleteButtonText: {
      color: 'white',
      fontSize: 12,
    },
    serviceDescription: {
      color: isDark ? Colors.dark.text : Colors.light.text,
      opacity: 0.8,
      marginTop: 4,
    },
    serviceInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    servicePrice: {
      color: Colors[theme].tint,
      fontWeight: 'bold',
    },
    serviceDate: {
      color: isDark ? Colors.dark.text : Colors.light.text,
      opacity: 0.6,
      fontSize: 12,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 32,
      opacity: 0.7,
      color: isDark ? Colors.dark.text : Colors.light.text,
    },
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('screens.servicesTitle')}</ThemedText>
        <ThemedText style={styles.emptyText}>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">{t('screens.servicesTitle')}</ThemedText>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>{t('services.create')}</Text>
        </TouchableOpacity>
      </View>

      <ThemedText style={{ opacity: 0.7, marginBottom: 16 }}>
        {t('screens.servicesSubtitle')}
      </ThemedText>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>{item.nome}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteService(item.id)}
              >
                <Text style={styles.deleteButtonText}>{t('services.delete')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.serviceDescription}>{item.descricao}</Text>
            <View style={styles.serviceInfo}>
              <Text style={styles.servicePrice}>
                R$ {item.valor_minimo.toFixed(2)} - R$ {item.valor_maximo.toFixed(2)}
              </Text>
              <Text style={styles.serviceDate}>
                {new Date(item.data_inicio).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('services.noServices')}</Text>
        }
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>{t('services.create')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('services.name')}
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('services.description')}
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              multiline
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('services.minValue')}
              value={formData.valor_minimo.toString()}
              onChangeText={(text) => setFormData({ ...formData, valor_minimo: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('services.maxValue')}
              value={formData.valor_maximo.toString()}
              onChangeText={(text) => setFormData({ ...formData, valor_maximo: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <TextInput
              style={styles.input}
              placeholder={t('services.startDate')}
              value={formData.data_inicio}
              onChangeText={(text) => setFormData({ ...formData, data_inicio: text })}
              placeholderTextColor={isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.buttonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleCreateService}
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


