import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../../contexts/AuthContext';
import {useWebSocket} from '../../contexts/WebSocketContext';
import {useLocation} from '../../hooks/useLocation';
import {quickServiceService} from '../../api/services/quickServiceService';
import {categoriesService} from '../../api/services/categoriesService';
import {userService} from '../../api/services/userService';
import type {Category, WSQuickServiceRequestData, WSMessage} from '../../types/api.types';

const QuickServicePrestadorScreen: React.FC = () => {
  const {user, setUser} = useAuth();
  const {connectionStatus, addMessageHandler, sendMessage} = useWebSocket();
  const {location: gpsLocation, loading: gpsLoading, requestLocation} = useLocation();

  const [isAvailable, setIsAvailable] = useState(user?.disponivel_servico_rapido || false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<WSQuickServiceRequestData[]>([]);
  const [autoAccept, setAutoAccept] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Auto-set test prestador availability on mount
  useEffect(() => {
    if (user?.id === 5) {
      // Test prestador - auto-configure
      setLatitude('-23.550520');
      setLongitude('-46.633308');
      setAutoAccept(true);
    }
  }, [user?.id]);

  // Auto-fill coordinates when GPS location is obtained
  useEffect(() => {
    if (gpsLocation) {
      setLatitude(gpsLocation.latitude.toString());
      setLongitude(gpsLocation.longitude.toString());
    }
  }, [gpsLocation]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoriesService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Erro', 'Falha ao carregar categorias');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Register WebSocket handler for incoming requests
  useEffect(() => {
    const unregister = addMessageHandler((message: WSMessage) => {
      if (message.type === 'quick_service_request') {
        const requestData = message as WSQuickServiceRequestData;
        console.log('📩 Received quick service request:', requestData);
        
        setIncomingRequests(prev => [...prev, requestData]);
        
        // Auto-accept if enabled
        if (autoAccept) {
          handleAcceptRequest(requestData.requestId);
        } else {
          // Show notification
          Alert.alert(
            '🔔 Nova Solicitação',
            `${requestData.clienteNome} precisa de ${requestData.categoriaNome}\nValor: R$ ${requestData.valorMinimo.toFixed(2)}\nDistância: ${(requestData.distanceMeters / 1000).toFixed(1)} km`,
            [
              {text: 'Ver Detalhes', onPress: () => {}},
              {text: 'OK', style: 'cancel'},
            ],
          );
        }
      } else if (message.type === 'quick_service_started') {
        Alert.alert('✅ Sucesso', 'Serviço iniciado com sucesso!');
        // Remove accepted request from list
        setIncomingRequests([]);
      }
    });

    return () => unregister();
  }, [addMessageHandler, autoAccept]);

  // Auto-update location every 3 minutes when available
  useEffect(() => {
    if (!isAvailable) return;

    const interval = setInterval(() => {
      if (latitude && longitude) {
        console.log('🔄 Auto-updating location (3min interval)');
        handleUpdateAvailability(true);
      }
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [isAvailable, latitude, longitude]);

  const handleUpdateAvailability = async (newAvailability?: boolean) => {
    const targetAvailability = newAvailability !== undefined ? newAvailability : !isAvailable;

    // Validate coordinates if enabling
    if (targetAvailability) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (!latitude || !longitude || isNaN(lat) || isNaN(lon)) {
        Alert.alert('Erro', 'Informe coordenadas válidas');
        return;
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        Alert.alert('Erro', 'Coordenadas inválidas');
        return;
      }

      if (selectedCategories.length === 0) {
        Alert.alert('Erro', 'Selecione pelo menos uma categoria');
        return;
      }
    }

    try {
      setLoading(true);

      const data = targetAvailability
        ? {
            disponivel: true,
            lat: parseFloat(latitude),
            lon: parseFloat(longitude),
            categoryIds: selectedCategories,
          }
        : {disponivel: false};

      const result = await quickServiceService.updateAvailability(data);

      if (result.success) {
        setIsAvailable(result.disponivel);
        
        // Update user context
        if (user) {
          const updatedUser = await userService.getMe();
          setUser(updatedUser);
        }

        Alert.alert(
          'Sucesso',
          result.disponivel
            ? 'Você está disponível para serviços rápidos!'
            : 'Disponibilidade desativada',
        );
      }
    } catch (error: any) {
      console.error('Error updating availability:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao atualizar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      console.log('✅ Accepting request:', requestId);
      
      sendMessage({
        type: 'quick_service_response',
        requestId,
        action: 'accept',
      });

      // Remove from list (optimistic update)
      setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId));
      
      Alert.alert('Aguarde', 'Processando aceitação...');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Erro', 'Falha ao aceitar solicitação');
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    console.log('❌ Declining request:', requestId);
    
    sendMessage({
      type: 'quick_service_response',
      requestId,
      action: 'decline',
    });

    setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId));
    Alert.alert('Recusado', 'Solicitação recusada');
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="person-outline" size={40} color="#FF9500" />
        <Text style={styles.title}>Disponibilidade Prestador</Text>
        <Text style={styles.subtitle}>
          Gerencie sua disponibilidade para atendimentos rápidos
        </Text>
      </View>

      {/* WebSocket Status */}
      <View style={[styles.wsStatus, connectionStatus === 'connected' ? styles.wsConnected : styles.wsDisconnected]}>
        <Icon name={connectionStatus === 'connected' ? 'wifi' : 'wifi-off'} size={16} color="#fff" />
        <Text style={styles.wsText}>
          {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {/* Availability Toggle */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Disponível para Atendimento</Text>
            <Text style={styles.toggleSubtitle}>
              Receba solicitações de clientes próximos
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={() => handleUpdateAvailability()}
            disabled={loading}
            trackColor={{false: '#D1D1D6', true: '#34C759'}}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Auto-Accept Toggle (Test Mode) */}
      {user?.id === 5 && (
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>🤖 Auto-Aceitar (Teste)</Text>
              <Text style={styles.toggleSubtitle}>
                Aceita solicitações automaticamente
              </Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{false: '#D1D1D6', true: '#FF9500'}}
              thumbColor="#fff"
            />
          </View>
        </View>
      )}

      {/* Location Input */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Localização</Text>
        <Text style={styles.cardSubtitle}>
          Coordenadas expiram em 5 minutos. Atualize periodicamente.
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="-23.550520"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="-46.633308"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.gpsButton, gpsLoading && styles.gpsButtonLoading]}
          onPress={requestLocation}
          disabled={loading || gpsLoading}>
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Icon name="my-location" size={20} color="#007AFF" />
          )}
          <Text style={styles.gpsButtonText}>
            {gpsLoading ? 'Obtendo localização...' : 'Usar Minha Localização (GPS)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏷️ Categorias de Serviço</Text>
        <Text style={styles.cardSubtitle}>
          Selecione as categorias que você atende
        </Text>
        {loadingCategories ? (
          <ActivityIndicator size="small" color="#007AFF" style={{marginTop: 16}} />
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category.id) && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(category.id)}
                disabled={loading}>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category.id) && styles.categoryChipTextSelected,
                  ]}>
                  {category.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Solicitações Recebidas ({incomingRequests.length})</Text>
          {incomingRequests.map(request => (
            <View key={request.requestId} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestClient}>
                  <Icon name="person" size={24} color="#007AFF" />
                  <Text style={styles.requestClientName}>{request.clienteNome}</Text>
                </View>
                <View style={styles.requestDistance}>
                  <Icon name="place" size={16} color="#666" />
                  <Text style={styles.requestDistanceText}>
                    {(request.distanceMeters / 1000).toFixed(1)} km
                  </Text>
                </View>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestCategory}>📂 {request.categoriaNome}</Text>
                <Text style={styles.requestValue}>💰 R$ {request.valorMinimo.toFixed(2)}</Text>
              </View>
              {request.descricao && (
                <Text style={styles.requestDescription}>{request.descricao}</Text>
              )}
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.requestButton, styles.requestButtonDecline]}
                  onPress={() => handleDeclineRequest(request.requestId)}>
                  <Icon name="close" size={20} color="#fff" />
                  <Text style={styles.requestButtonText}>Recusar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestButton, styles.requestButtonAccept]}
                  onPress={() => handleAcceptRequest(request.requestId)}>
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={styles.requestButtonText}>Aceitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Update Button */}
      <TouchableOpacity
        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
        onPress={() => handleUpdateAvailability()}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="save" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>Salvar Disponibilidade</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  wsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
    gap: 6,
  },
  wsConnected: {
    backgroundColor: '#34C759',
  },
  wsDisconnected: {
    backgroundColor: '#FF3B30',
  },
  wsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9F9F9',
  },
  buttonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    gap: 8,
  },
  buttonDisabledText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  gpsButtonLoading: {
    backgroundColor: '#F0F0F0',
    borderColor: '#DDD',
  },
  gpsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  requestCard: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestDistanceText: {
    fontSize: 12,
    color: '#666',
  },
  requestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestCategory: {
    fontSize: 14,
    color: '#666',
  },
  requestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  requestDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  requestButtonDecline: {
    backgroundColor: '#FF3B30',
  },
  requestButtonAccept: {
    backgroundColor: '#34C759',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#999',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuickServicePrestadorScreen;
