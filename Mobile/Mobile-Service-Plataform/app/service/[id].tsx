import { StyleSheet, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';
import { ThemedButton } from '@/components/themed-button';
import { useEffect, useState } from 'react';
import { apiService, Service } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';

export default function ServiceDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && params.id) {
      apiService.setToken(token);
      loadService();
    }
  }, [token, params.id]);

  const loadService = async () => {
    try {
      const data = await apiService.getService(parseInt(params.id!));
      setService(data);
    } catch (error) {
      Alert.alert(t('common.error'), 'Erro ao carregar serviço');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  if (!service) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Serviço não encontrado</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{service.nome}</ThemedText>
      <ThemedText>
        R$ {service.valor_minimo.toFixed(2)} - R$ {service.valor_maximo.toFixed(2)}
      </ThemedText>
      <ThemedText>{service.usuario?.nome || 'Usuário'}</ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle">Descrição</ThemedText>
        <ThemedText>{service.descricao}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Data de Início</ThemedText>
        <ThemedText>
          {new Date(service.data_inicio).toLocaleDateString()}
        </ThemedText>
      </View>

      {service.usuario?.cidade && service.usuario?.estado && (
        <View style={styles.section}>
          <ThemedText type="subtitle">Localização</ThemedText>
          <ThemedText>{service.usuario.cidade}, {service.usuario.estado}</ThemedText>
        </View>
      )}

      <ThemedButton title="Aceitar serviço" onPress={() => Alert.alert('Serviço aceito!')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  section: {
    gap: 4,
  },
});


