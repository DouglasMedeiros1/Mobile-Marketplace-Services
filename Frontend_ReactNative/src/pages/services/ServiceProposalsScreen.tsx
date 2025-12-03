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
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {HomeStackParamList} from '../../types/navigation.types';
import {proposalsService} from '../../api/services/proposalsService';
import type {Proposal} from '../../types/api.types';

type ServiceProposalsRouteProp = RouteProp<HomeStackParamList, 'ProposalsList'>;

interface ProposalWithPrestadorInfo extends Proposal {
  prestadorNome?: string;
}

const ServiceProposalsScreen: React.FC = () => {
  const route = useRoute<ServiceProposalsRouteProp>();
  const {serviceId} = route.params;
  
  const [proposals, setProposals] = useState<ProposalWithPrestadorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const loadProposals = useCallback(async () => {
    try {
      const data = await proposalsService.getProposalsByService(serviceId);
      setProposals(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar propostas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProposals();
  };

  const handleAcceptProposal = async (proposalId: number) => {
    Alert.alert(
      'Aceitar Proposta',
      'Deseja realmente aceitar esta proposta? Esta ação não pode ser desfeita.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Aceitar',
          onPress: async () => {
            setAcceptingId(proposalId);
            try {
              await proposalsService.updateProposalStatus(proposalId, {status: 'aceito'});
              Alert.alert('Sucesso', 'Proposta aceita com sucesso!');
              loadProposals();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Falha ao aceitar proposta');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceito':
        return '#4CAF50';
      case 'recusado':
        return '#F44336';
      case 'cancelado':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'aceito':
        return 'Aceito';
      case 'recusado':
        return 'Recusado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const renderProposalCard = ({item}: {item: ProposalWithPrestadorInfo}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.prestadorInfo}>
          <Icon name="person" size={20} color="#666" />
          <Text style={styles.prestadorName}>
            {item.prestadorNome || `Prestador #${item.prestador_id}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Valor da Proposta:</Text>
          <Text style={styles.priceValue}>
            R$ {parseFloat(String(item.valor)).toFixed(2)}
          </Text>
        </View>

        {item.mensagem && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mensagem:</Text>
            <Text style={styles.messageText}>{item.mensagem}</Text>
          </View>
        )}

        <Text style={styles.dateText}>
          Enviada em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Accept button only for pending proposals */}
      {item.status === 'aberto' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptProposal(item.id)}
          disabled={acceptingId === item.id}>
          {acceptingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check-circle" size={20} color="#fff" />
              <Text style={styles.acceptButtonText}>Aceitar Proposta</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
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
        data={proposals}
        renderItem={renderProposalCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma proposta recebida</Text>
            <Text style={styles.emptySubText}>
              Aguarde os prestadores enviarem propostas para este serviço
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
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  prestadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prestadorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardContent: {
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  messageContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default ServiceProposalsScreen;
