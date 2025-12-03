import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {PieChart, BarChart} from 'react-native-chart-kit';
import {useAuth} from '../../contexts/AuthContext';
import {dashboardService} from '../../api/services/dashboardService';
import type {ClienteDashboardResponse} from '../../types/api.types';

const screenWidth = Dimensions.get('window').width;

const ClienteDashboardScreen: React.FC = () => {
  const {user} = useAuth();
  const [data, setData] = useState<ClienteDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      const dashboardData = await dashboardService.getClienteDashboard(user.id);
      setData(dashboardData);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Não foi possível carregar dados</Text>
      </View>
    );
  }

  // Dados para gráfico de pizza - Status dos Serviços
  const statusData = [
    {
      name: 'Abertos',
      population: data.servicosAbertos,
      color: '#FFC107',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Em Andamento',
      population: data.servicosEmAndamento,
      color: '#2196F3',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Concluídos',
      population: data.servicosConcluidos,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Cancelados',
      population: data.servicosCancelados,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0);

  // Dados para gráfico de barras - Propostas
  const propostasBarData = {
    labels: ['Com Proposta', 'Sem Proposta'],
    datasets: [
      {
        data: [data.servicosComProposta, data.servicosSemProposta],
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Cliente</Text>
        <Text style={styles.subtitle}>Visão geral dos seus serviços</Text>
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardValue}>{data.totalServicos}</Text>
          <Text style={styles.cardLabel}>Total Serviços</Text>
        </View>
        <View style={[styles.card, styles.cardSuccess]}>
          <Text style={styles.cardValue}>{data.totalPropostasRecebidas}</Text>
          <Text style={styles.cardLabel}>Propostas Recebidas</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardInfo]}>
          <Text style={styles.cardValue}>
            {data.avaliacaoMedia > 0 ? data.avaliacaoMedia.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.cardLabel}>Avaliação Média</Text>
        </View>
        <View style={[styles.card, styles.cardWarning]}>
          <Text style={styles.cardValue}>R$ {data.totalGasto.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Total Gasto</Text>
        </View>
      </View>

      {/* Gráfico de Pizza - Status dos Serviços */}
      {statusData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Status dos Serviços</Text>
          <PieChart
            data={statusData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      {/* Gráfico de Barras - Propostas */}
      {data.totalServicos > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Serviços por Propostas</Text>
          <BarChart
            data={propostasBarData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e0e0e0',
              },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      )}

      {/* Cards de Métricas Adicionais */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Propostas Aceitas</Text>
          <Text style={styles.metricValue}>{data.propostasAceitas}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Valor Médio por Serviço</Text>
          <Text style={styles.metricValue}>
            R$ {data.valorMedioPorServico.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total de Propostas Aceitas</Text>
          <Text style={styles.metricValue}>
            R$ {data.valorTotalPropostasAceitas.toFixed(2)}
          </Text>
        </View>
      </View>

      {data.totalServicos === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Você ainda não criou nenhum serviço.
          </Text>
          <Text style={styles.emptySubtext}>
            Crie seu primeiro serviço para ver as estatísticas aqui.
          </Text>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPrimary: {
    backgroundColor: '#2196F3',
  },
  cardSuccess: {
    backgroundColor: '#4CAF50',
  },
  cardInfo: {
    backgroundColor: '#FF9800',
  },
  cardWarning: {
    backgroundColor: '#9C27B0',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
  },
  metricsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ClienteDashboardScreen;
