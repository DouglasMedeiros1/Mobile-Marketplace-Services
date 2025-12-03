import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import type {ServiceDetailRouteProp} from '../../types/navigation.types';
import {servicesService} from '../../api/services/servicesService';
import type {Service} from '../../types/api.types';
import {useAuth} from '../../contexts/AuthContext';
import {format} from 'date-fns';

const ServiceDetailScreen: React.FC = () => {
  const route = useRoute<ServiceDetailRouteProp>();
  const navigation = useNavigation();
  const {user} = useAuth();
  const {serviceId} = route.params;
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const isCliente = user?.roles.includes('cliente');
  const isPrestador = user?.roles.includes('prestador');
  const isOwner = service?.user_id === user?.id;

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      const data = await servicesService.getServiceById(serviceId);
      setService(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar detalhes do serviço');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (!service) return;
    
    // Navigate to chat tab and then to the specific chat screen
    navigation.dispatch(
      CommonActions.navigate({
        name: 'ChatTab',
        params: {
          screen: 'Chat',
          params: {
            otherUserId: service.user_id,
            otherUserName: 'Cliente',
          },
        },
      })
    );
  };

  const handleCreateProposal = () => {
    if (!service) return;
    
    // Navigate to proposals tab and then to create proposal screen
    navigation.dispatch(
      CommonActions.navigate({
        name: 'ProposalsTab',
        params: {
          screen: 'CreateProposal',
          params: {serviceId: service.id},
        },
      })
    );
  };

  const handleViewProposals = () => {
    if (!service) return;
    
    // Navigate to ProposalsList in the current stack
    navigation.navigate('ProposalsList' as never, {serviceId: service.id} as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Serviço não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Service Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{service.nome}</Text>
            {service.quick && (
              <View style={styles.quickBadge}>
                <Icon name="flash-on" size={16} color="#fff" />
                <Text style={styles.quickText}>Rápido</Text>
              </View>
            )}
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {service.status === 'aberto' ? 'Aberto' : service.status === 'fechado' ? 'Fechado' : service.status}
            </Text>
          </View>
        </View>

        {/* Description */}
        {service.descricao && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{service.descricao}</Text>
          </View>
        )}

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faixa de Preço</Text>
          <Text style={styles.priceText}>
            R$ {parseFloat(String(service.valor_minimo)).toFixed(2)} - R$ {parseFloat(String(service.valor_maximo)).toFixed(2)}
          </Text>
        </View>

        {/* Location */}
        {service.local && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <View style={styles.locationRow}>
              <Icon name="location-on" size={20} color="#666" />
              <Text style={styles.locationText}>{service.local}</Text>
            </View>
          </View>
        )}

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prazo</Text>
          <View style={styles.dateRow}>
            <Icon name="event" size={20} color="#666" />
            <Text style={styles.dateText}>
              Até {format(new Date(service.data_fim), 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        {service.metodo_pagamento && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pagamento</Text>
            <Text style={styles.infoText}>
              {service.metodo_pagamento === 'pix' ? 'PIX' : 
               service.metodo_pagamento === 'dinheiro' ? 'Dinheiro' : 
               service.metodo_pagamento === 'cartao' ? 'Cartão' : 
               service.metodo_pagamento}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {/* For Prestadores viewing client services */}
        {isPrestador && !isOwner && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.chatButton]}
              onPress={handleChat}>
              <Icon name="chat" size={20} color="#fff" />
              <Text style={styles.buttonText}>Chat com Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.proposalButton]}
              onPress={handleCreateProposal}>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>Fazer Proposta</Text>
            </TouchableOpacity>
          </>
        )}

        {/* For Clientes viewing their own services */}
        {isCliente && isOwner && (
          <TouchableOpacity
            style={[styles.button, styles.viewProposalsButton]}
            onPress={handleViewProposals}>
            <Icon name="description" size={20} color="#fff" />
            <Text style={styles.buttonText}>Ver Propostas</Text>
          </TouchableOpacity>
        )}
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  quickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#2196F3',
  },
  proposalButton: {
    backgroundColor: '#4CAF50',
  },
  viewProposalsButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceDetailScreen;
