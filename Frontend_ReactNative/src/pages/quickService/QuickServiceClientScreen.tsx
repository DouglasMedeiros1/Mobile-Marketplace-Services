import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../../contexts/AuthContext';
import {useWebSocket} from '../../contexts/WebSocketContext';
import {useLocation} from '../../hooks/useLocation';
import {quickServiceService} from '../../api/services/quickServiceService';
import {categoriesService} from '../../api/services/categoriesService';
import {servicesService} from '../../api/services/servicesService';
import type {Category, WSMessage, WSQuickServiceMatchedData} from '../../types/api.types';
import type {HomeStackNavigationProp} from '../../types/navigation.types';

const QuickServiceClientScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const {user} = useAuth();
  const {connectionStatus, addMessageHandler} = useWebSocket();
  const {location: gpsLocation, loading: gpsLoading, requestLocation} = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searching, setSearching] = useState(false);
  const [matchedService, setMatchedService] = useState<{
    serviceId: number;
    prestadorId: number;
    prestadorNome: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // Register WebSocket handler for match notifications
  useEffect(() => {
    const unregister = addMessageHandler((message: WSMessage) => {
      if (message.type === 'quick_service_matched') {
        const matchData = message as WSQuickServiceMatchedData;
        console.log('✅ Service matched:', matchData);
        
        setSearching(false);
        setMatchedService({
          serviceId: matchData.serviceId,
          prestadorId: matchData.prestadorId,
          prestadorNome: matchData.prestadorNome,
        });
        setShowSuccessModal(true);
      }
    });

    return () => unregister();
  }, [addMessageHandler]);

  const handleRequestService = async () => {
    // Validation
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

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

    try {
      setLoading(true);
      setSearching(true);

      // Get selected category to get minimum value
      const category = categories.find(c => c.id === selectedCategory);
      const valorMinimo = 50.0; // Default minimum, adjust based on category if needed

      const response = await quickServiceService.requestService({
        lat,
        lon,
        categoryId: selectedCategory,
        descricao: descricao.trim() || undefined,
        valorMinimo,
      });

      console.log('Quick service response:', response);

      if (response.success && response.serviceId) {
        // Match found immediately
        setMatchedService({
          serviceId: response.serviceId,
          prestadorId: response.prestadorId!,
          prestadorNome: response.prestadorNome!,
        });
        setShowSuccessModal(true);
        setSearching(false);
      } else if (!response.success) {
        // No prestadores available
        setSearching(false);
        Alert.alert(
          'Sem Prestadores',
          response.message || 'Nenhum prestador disponível na sua região no momento. Tente novamente mais tarde.',
        );
      }
    } catch (error: any) {
      console.error('Error requesting service:', error);
      setSearching(false);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Falha ao solicitar serviço rápido',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewService = async () => {
    if (!matchedService) return;

    try {
      setShowSuccessModal(false);
      
      // Navigate to service detail
      navigation.navigate('ServiceDetail', {serviceId: matchedService.serviceId});
      
      // Reset form
      setSelectedCategory(null);
      setDescricao('');
      setMatchedService(null);
    } catch (error) {
      console.error('Error navigating to service:', error);
      Alert.alert('Erro', 'Falha ao carregar serviço');
    }
  };

  const handleChatWithPrestador = () => {
    setShowSuccessModal(false);
    Alert.alert('Em breve', 'Funcionalidade de chat será implementada em breve');
    // TODO: Navigate to chat screen
    // navigation.navigate('Chat', {screen: 'ChatScreen', params: {userId: matchedService.prestadorId}});
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="search" size={40} color="#007AFF" />
        <Text style={styles.title}>Solicitar Serviço Rápido</Text>
        <Text style={styles.subtitle}>
          Encontre um prestador disponível na sua região agora
        </Text>
      </View>

      {/* WebSocket Status */}
      <View style={[styles.wsStatus, connectionStatus === 'connected' ? styles.wsConnected : styles.wsDisconnected]}>
        <Icon name={connectionStatus === 'connected' ? 'wifi' : 'wifi-off'} size={16} color="#fff" />
        <Text style={styles.wsText}>
          {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {/* Location Input */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Sua Localização</Text>
        <Text style={styles.cardSubtitle}>
          Informe onde você precisa do serviço
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
              editable={!loading && !searching}
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
              editable={!loading && !searching}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.gpsButton, gpsLoading && styles.gpsButtonLoading]}
          onPress={requestLocation}
          disabled={loading || searching || gpsLoading}>
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

      {/* Category Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏷️ Categoria do Serviço</Text>
        <Text style={styles.cardSubtitle}>
          Selecione o tipo de serviço que você precisa
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
                  selectedCategory === category.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                disabled={loading || searching}>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextSelected,
                  ]}>
                  {category.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Service Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Detalhes do Serviço</Text>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={20} color="#666" />
          <Text style={styles.detailText}>Data/Hora: Agora (automático)</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={20} color="#666" />
          <Text style={styles.detailText}>Valor: Mínimo fixo (R$ 50,00)</Text>
        </View>
        <Text style={styles.inputLabel}>Descrição (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva brevemente o que você precisa..."
          multiline
          numberOfLines={4}
          editable={!loading && !searching}
        />
      </View>

      {/* Request Button */}
      {!searching ? (
        <TouchableOpacity
          style={[styles.requestButton, (loading || !selectedCategory) && styles.requestButtonDisabled]}
          onPress={handleRequestService}
          disabled={loading || !selectedCategory}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="flash-on" size={24} color="#fff" />
              <Text style={styles.requestButtonText}>Buscar Prestador Agora</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.searchingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.searchingTitle}>🔍 Procurando prestadores...</Text>
          <Text style={styles.searchingText}>
            Aguarde enquanto buscamos um prestador disponível na sua região
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSearching(false);
              Alert.alert('Cancelado', 'Busca cancelada');
            }}>
            <Text style={styles.cancelButtonText}>Cancelar Busca</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoBox}>
        <Icon name="info-outline" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          O serviço será criado automaticamente quando um prestador aceitar sua solicitação. 
          O valor e a data serão fixados para agilizar o atendimento.
        </Text>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={80} color="#34C759" />
            </View>
            <Text style={styles.modalTitle}>🎉 Prestador Encontrado!</Text>
            <Text style={styles.modalText}>
              {matchedService?.prestadorNome} aceitou sua solicitação
            </Text>
            <Text style={styles.modalSubtext}>
              O serviço foi criado e está pronto para início
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleChatWithPrestador}>
                <Icon name="chat" size={20} color="#007AFF" />
                <Text style={styles.modalButtonTextSecondary}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleViewService}>
                <Icon name="visibility" size={20} color="#fff" />
                <Text style={styles.modalButtonTextPrimary}>Ver Serviço</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setShowSuccessModal(false);
                setMatchedService(null);
              }}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  requestButtonDisabled: {
    backgroundColor: '#999',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchingCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  searchingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 6,
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalClose: {
    paddingVertical: 8,
  },
  modalCloseText: {
    color: '#999',
    fontSize: 14,
  },
});

export default QuickServiceClientScreen;
