import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import type {HomeNavigationProp} from '../../types/navigation.types';
import {proposalsService} from '../../api/services/proposalsService';
import {format} from 'date-fns';

interface ServiceWithAcceptedProposal {
  id: number;
  nome: string;
  descricao: string;
  valor_minimo: number;
  valor_maximo: number;
  local?: string;
  data_inicio: string;
  data_fim: string;
  quick?: boolean;
  categoria_nome?: string;
  cliente_nome?: string;
  cliente_email?: string;
  proposta_id: number;
  proposta_valor: number;
  proposta_mensagem?: string;
  proposta_status: string;
  proposta_created_at: string;
}

const ProposalsListScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  
  const [services, setServices] = useState<ServiceWithAcceptedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAcceptedServices = useCallback(async () => {
    try {
      const data = await proposalsService.getMyAcceptedServices();
      setServices(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar serviços');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAcceptedServices();
  }, [loadAcceptedServices]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAcceptedServices();
  };

  const renderServiceCard = ({item}: {item: ServiceWithAcceptedProposal}) => (
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

      {/* Cliente Info */}
      {item.cliente_nome && (
        <View style={styles.clienteContainer}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.clienteText}>{item.cliente_nome}</Text>
        </View>
      )}
      
      {item.descricao && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.descricao}
        </Text>
      )}
      
      <View style={styles.cardDetails}>
        <Text style={styles.priceLabel}>Orçamento do serviço:</Text>
        <Text style={styles.priceText}>
          R$ {parseFloat(String(item.valor_minimo)).toFixed(2)} - R$ {parseFloat(String(item.valor_maximo)).toFixed(2)}
        </Text>
        
        {item.local && (
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.local}
          </Text>
        )}
        
        {item.categoria_nome && (
          <Text style={styles.categoryText}>
            🏷️ {item.categoria_nome}
          </Text>
        )}
        
        <Text style={styles.dateText}>
          Prazo: {format(new Date(item.data_fim), 'dd/MM/yyyy')}
        </Text>
      </View>

      {/* Accepted Proposal Info */}
      <View style={styles.proposalSection}>
        <View style={styles.proposalHeader}>
          <Icon name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.proposalHeaderText}>Sua Proposta Aceita</Text>
        </View>
        
        <View style={styles.proposalValue}>
          <Text style={styles.proposalValueLabel}>Valor acordado:</Text>
          <Text style={styles.proposalValueText}>
            R$ {parseFloat(String(item.proposta_valor)).toFixed(2)}
          </Text>
        </View>

        {item.proposta_mensagem && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mensagem:</Text>
            <Text style={styles.messageText} numberOfLines={3}>
              {item.proposta_mensagem}
            </Text>
          </View>
        )}

        <Text style={styles.acceptedDate}>
          Aceita em: {format(new Date(item.proposta_created_at), 'dd/MM/yyyy HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Icon name="assignment-turned-in" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma proposta aceita</Text>
            <Text style={styles.emptySubText}>
              Quando suas propostas forem aceitas, os serviços aparecerão aqui
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 8,
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
  clienteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  clienteText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  proposalSection: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proposalHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  proposalValue: {
    marginBottom: 8,
  },
  proposalValueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  proposalValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  messageContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  acceptedDate: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
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

export default ProposalsListScreen;
