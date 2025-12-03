import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../../contexts/AuthContext';
import type {QuickServiceStackNavigationProp} from '../../types/navigation.types';

const QuickServiceHomeScreen: React.FC = () => {
  const navigation = useNavigation<QuickServiceStackNavigationProp>();
  const {user} = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const isPrestador = user.roles.includes('prestador');
  const isCliente = user.roles.includes('cliente');
  const isAvailable = user.disponivel_servico_rapido;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="flash-on" size={60} color="#FF9500" />
        <Text style={styles.title}>Serviço Rápido</Text>
        <Text style={styles.subtitle}>
          Conecte-se instantaneamente com {isPrestador ? 'clientes' : 'prestadores'} próximos
        </Text>
      </View>

      {/* Status Badge */}
      {isPrestador && (
        <View style={[styles.statusBadge, isAvailable ? styles.statusAvailable : styles.statusUnavailable]}>
          <Icon name={isAvailable ? 'check-circle' : 'cancel'} size={20} color="#fff" />
          <Text style={styles.statusText}>
            {isAvailable ? 'Disponível para atendimento' : 'Indisponível'}
          </Text>
        </View>
      )}

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Icon name="info-outline" size={24} color="#007AFF" />
          <Text style={styles.infoTitle}>Como funciona?</Text>
          {isCliente && (
            <Text style={styles.infoText}>
              1. Solicite um serviço urgente{'\n'}
              2. Aguarde a resposta de um prestador próximo{'\n'}
              3. Serviço criado automaticamente ao aceitar
            </Text>
          )}
          {isPrestador && (
            <Text style={styles.infoText}>
              1. Ative sua disponibilidade{'\n'}
              2. Receba notificações de clientes próximos{'\n'}
              3. Aceite ou recuse pedidos instantaneamente
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Icon name="schedule" size={24} color="#FF9500" />
          <Text style={styles.infoTitle}>Atendimento Imediato</Text>
          <Text style={styles.infoText}>
            Serviços rápidos são criados com data/hora atual e valor mínimo fixo para agilidade máxima.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {isCliente && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.navigate('QuickServiceClient')}>
            <Icon name="search" size={24} color="#fff" />
            <Text style={styles.buttonText}>Solicitar Serviço Rápido</Text>
          </TouchableOpacity>
        )}

        {isPrestador && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.navigate('QuickServicePrestador')}>
            <Icon name="settings" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              {isAvailable ? 'Gerenciar Disponibilidade' : 'Ativar Disponibilidade'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Dicas</Text>
        {isCliente && (
          <>
            <Text style={styles.tipText}>• Ative a localização para melhores resultados</Text>
            <Text style={styles.tipText}>• Prestadores próximos respondem mais rápido</Text>
            <Text style={styles.tipText}>• O valor é fixado no mínimo da categoria</Text>
          </>
        )}
        {isPrestador && (
          <>
            <Text style={styles.tipText}>• Mantenha sua localização atualizada</Text>
            <Text style={styles.tipText}>• Responda rapidamente às solicitações</Text>
            <Text style={styles.tipText}>• Coordenadas expiram em 5 minutos</Text>
          </>
        )}
      </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  statusAvailable: {
    backgroundColor: '#34C759',
  },
  statusUnavailable: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
});

export default QuickServiceHomeScreen;
