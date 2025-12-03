import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import type {HomeNavigationProp} from '../../types/navigation.types';
import {servicesService} from '../../api/services/servicesService';
import type {Service, Category} from '../../types/api.types';
import {useAuth} from '../../contexts/AuthContext';
import {format} from 'date-fns';
import CategorySearchBar from '../../components/CategorySearchBar';

const ServicesListScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const {user} = useAuth();
  
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const loadServices = useCallback(async () => {
    try {
      const data = await servicesService.getServices();
      // Filter out services created by the current prestador (they shouldn't bid on their own services)
      // Also filter to show only services that are "open" for proposals
      const availableServices = data.filter(
        service => service.user_id !== user?.id && service.status !== 'fechado'
      );
      setAllServices(availableServices);
      setServices(availableServices);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar serviços');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    if (category) {
      const filtered = allServices.filter(service => service.categoria_id === category.id);
      setServices(filtered);
    } else {
      setServices(allServices);
    }
  };

  const renderServiceCard = ({item}: {item: Service}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', {serviceId: item.id})}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        {item.quick && (
          <View style={styles.quickBadge}>
            <Icon name="flash-on" size={14} color="#fff" />
            <Text style={styles.quickText}>Rápido</Text>
          </View>
        )}
      </View>
      
      {item.descricao && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.descricao}
        </Text>
      )}
      
      <View style={styles.cardDetails}>
        <Text style={styles.priceText}>
          R$ {parseFloat(String(item.valor_minimo)).toFixed(2)} - R$ {parseFloat(String(item.valor_maximo)).toFixed(2)}
        </Text>
        {item.local && (
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.local}
          </Text>
        )}
        <Text style={styles.dateText}>
          Até: {format(new Date(item.data_fim), 'dd/MM/yyyy')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const isCliente = user?.roles.includes('cliente');

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <CategorySearchBar
          onCategorySelect={handleCategorySelect}
          placeholder="Pesquisar por categoria..."
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum serviço disponível</Text>
              <Text style={styles.emptySubText}>
                Não há serviços abertos para você fazer propostas no momento
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  quickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ServicesListScreen;
