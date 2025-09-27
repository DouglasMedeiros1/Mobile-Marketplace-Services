import { FlatList, Pressable, StyleSheet, View, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/contexts/I18nContext';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { apiService, Service } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function FeedScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
      loadServices();
    }
  }, [token]);

  const loadServices = async () => {
    try {
      const data = await apiService.getServices();
      setServices(data);
    } catch (error) {
      Alert.alert(t('common.error'), 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('screens.feedTitle')}</ThemedText>
        <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('screens.feedTitle')}</ThemedText>
      <ThemedText style={styles.subtitle}>{t('screens.feedSubtitle')}</ThemedText>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        renderItem={({ item }) => <ServiceCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>{t('services.noServices')}</ThemedText>
        }
      />
    </ThemedView>
  );
}

function ServiceCard({ item }: { item: Service }) {
  return (
    <Link
      href={{ pathname: '/service/[id]', params: { id: item.id.toString() } }}
      asChild
    >
      <Pressable style={styles.card}>
        <ThemedText type="subtitle">{item.nome}</ThemedText>
        <ThemedText style={styles.description}>{item.descricao}</ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <ThemedText>R$ {item.valor_minimo.toFixed(2)} - R$ {item.valor_maximo.toFixed(2)}</ThemedText>
          <ThemedText>{item.usuario?.nome || 'Usuário'}</ThemedText>
        </View>
        <ThemedText style={styles.date}>
          {new Date(item.data_inicio).toLocaleDateString()}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  description: {
    marginTop: 4,
    opacity: 0.8,
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6,
  },
});
