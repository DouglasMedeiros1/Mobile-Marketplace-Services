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
import {PieChart, BarChart, ProgressChart} from 'react-native-chart-kit';
import {useAuth} from '../../contexts/AuthContext';
import {dashboardService} from '../../api/services/dashboardService';
import type {PrestadorDashboardResponse} from '../../types/api.types';

const screenWidth = Dimensions.get('window').width;

const PrestadorDashboardScreen: React.FC = () => {
  const {user} = useAuth();
  const [data, setData] = useState<PrestadorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      const dashboardData = await dashboardService.getPrestadorDashboard(
        user.id
      );
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

  // Dados para gráfico de pizza - Status das Propostas
  const statusData = [
    {
      name: 'Abertas',
      population: data.propostasAbertas,
      color: '#FFC107',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Aceitas',
      population: data.propostasAceitas,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Rejeitadas',
      population: data.propostasRejeitadas,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Canceladas',
      population: data.propostasCanceladas,
      color: '#9E9E9E',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0);

  // Dados para gráfico de barras - Top Categorias
  const topCategorias = data.categoriasMaisTrabalhadas.slice(0, 5);
  const categoriasBarData =
    topCategorias.length > 0
      ? {
          labels: topCategorias.map(cat => cat.nome.substring(0, 10)),
          datasets: [
            {
              data: topCategorias.map(cat => cat.quantidade),
            },
          ],
        }
      : null;

  // Dados para gráfico de progresso - Taxa de Aceitação
  const progressData = {
    labels: ['Aceitação'],
    data: [data.taxaAceitacao / 100],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Prestador</Text>
        <Text style={styles.subtitle}>Visão geral do seu desempenho</Text>
      </View>

      {/* Cards de Estatísticas Principais */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardSuccess]}>
          <Text style={styles.cardValue}>
            R$ {data.valorTotalGanho.toFixed(2)}
          </Text>
          <Text style={styles.cardLabel}>Total Ganho</Text>
        </View>
        <View style={[styles.card, styles.cardInfo]}>
          <Text style={styles.cardValue}>
            {data.taxaAceitacao.toFixed(1)}%
          </Text>
          <Text style={styles.cardLabel}>Taxa Aceitação</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardValue}>
            {data.avaliacaoMedia > 0 ? data.avaliacaoMedia.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.cardLabel}>Avaliação Média</Text>
        </View>
        <View style={[styles.card, styles.cardWarning]}>
          <Text style={styles.cardValue}>{data.clientesAtendidos}</Text>
          <Text style={styles.cardLabel}>Clientes Atendidos</Text>
        </View>
      </View>

      {/* Resumo Financeiro */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Resumo Financeiro</Text>
        <View style={styles.financialSummary}>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Total Ganho</Text>
            <Text style={[styles.financialValue, {color: '#4CAF50'}]}>
              R$ {data.valorTotalGanho.toFixed(2)}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Em Andamento</Text>
            <Text style={[styles.financialValue, {color: '#2196F3'}]}>
              R$ {data.valorEmAndamento.toFixed(2)}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Valor Médio/Serviço</Text>
            <Text style={[styles.financialValue, {color: '#FF9800'}]}>
              R$ {data.valorMedioPorServico.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfico de Progresso - Taxa de Aceitação */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Taxa de Aceitação</Text>
        <ProgressChart
          data={progressData}
          width={screenWidth - 70}
          height={180}
          strokeWidth={16}
          radius={60}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          hideLegend={false}
          style={styles.chart}
        />
        <Text style={styles.progressText}>
          {data.taxaAceitacao.toFixed(1)}% das propostas aceitas
        </Text>
      </View>

      {/* Gráfico de Pizza - Status das Propostas */}
      {statusData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Status das Propostas</Text>
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

      {/* Gráfico de Barras - Top 5 Categorias */}
      {categoriasBarData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Top 5 Categorias Trabalhadas</Text>
          <BarChart
            data={categoriasBarData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
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
            fromZero
          />
        </View>
      )}

      {/* Cards de Métricas de Propostas e Serviços */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total de Propostas</Text>
          <Text style={styles.metricValue}>{data.totalPropostasCriadas}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Propostas Aceitas</Text>
          <Text style={styles.metricValue}>{data.propostasAceitas}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Serviços Finalizados</Text>
          <Text style={styles.metricValue}>{data.servicosFinalizados}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Serviços em Andamento</Text>
          <Text style={styles.metricValue}>{data.servicosEmAndamento}</Text>
        </View>
      </View>

      {data.totalPropostasCriadas === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Você ainda não criou nenhuma proposta.
          </Text>
          <Text style={styles.emptySubtext}>
            Comece a enviar propostas para ver as estatísticas aqui.
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
    backgroundColor: '#4CAF50',
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
    color: '#E8F5E9',
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
    alignSelf: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  financialSummary: {
    gap: 15,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default PrestadorDashboardScreen;
