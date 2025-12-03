import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {servicesService} from '../../api/services/servicesService';
import {categoriesService} from '../../api/services/categoriesService';
import type {Category} from '../../types/api.types';
import type {HomeNavigationProp} from '../../types/navigation.types';
import {useNavigation} from '@react-navigation/native';

const CreateServiceScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const {user} = useAuth();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [dataInicioDate, setDataInicioDate] = useState('');
  const [dataInicioTime, setDataInicioTime] = useState('');
  const [dataFimDate, setDataFimDate] = useState('');
  const [dataFimTime, setDataFimTime] = useState('23:59');
  const [local, setLocal] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Erro', 'Falha ao carregar categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const setDateToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDataFimDate(`${year}-${month}-${day}`);
  };

  const setDateTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    setDataFimDate(`${year}-${month}-${day}`);
  };

  const setDateNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const year = nextWeek.getFullYear();
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const day = String(nextWeek.getDate()).padStart(2, '0');
    setDataFimDate(`${year}-${month}-${day}`);
  };

  const handleCreate = async () => {
    // Validações
    if (!nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (!categoryId) {
      Alert.alert('Erro', 'Categoria é obrigatória');
      return;
    }

    if (!dataFimDate.trim()) {
      Alert.alert('Erro', 'Data de término é obrigatória');
      return;
    }

    const minimo = parseFloat(valorMinimo);
    const maximo = parseFloat(valorMaximo);

    if (isNaN(minimo) || minimo <= 0) {
      Alert.alert('Erro', 'Valor mínimo inválido');
      return;
    }

    if (isNaN(maximo) || maximo <= 0) {
      Alert.alert('Erro', 'Valor máximo inválido');
      return;
    }

    if (minimo > maximo) {
      Alert.alert('Erro', 'Valor mínimo não pode ser maior que o máximo');
      return;
    }

    // Formatar datas no formato YYYY-MM-DD HH:MM:SS
    const dataFimFormatted = `${dataFimDate} ${dataFimTime}:00`;
    const dataInicioFormatted = dataInicioDate && dataInicioTime 
      ? `${dataInicioDate} ${dataInicioTime}:00` 
      : undefined;

    setLoading(true);
    try {
      await servicesService.createService({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        valor_minimo: minimo,
        valor_maximo: maximo,
        data_inicio: dataInicioFormatted,
        data_fim: dataFimFormatted,
        local: local.trim() || undefined,
        metodo_pagamento: metodoPagamento.trim() || undefined,
        category_id: categoryId,
      });

      Alert.alert('Sucesso', 'Serviço criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ServicesList'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating service:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Falha ao criar serviço',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando categorias...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Novo Serviço</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome do Serviço *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Limpeza Residencial"
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />

            <Text style={styles.label}>Categoria *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    categoryId === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  disabled={loading}>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      categoryId === cat.id && styles.categoryButtonTextActive,
                    ]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva o serviço..."
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Valor Mínimo (R$) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={valorMinimo}
                  onChangeText={setValorMinimo}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.halfColumn}>
                <Text style={styles.label}>Valor Máximo (R$) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={valorMaximo}
                  onChangeText={setValorMaximo}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <Text style={styles.label}>Data de Início (Opcional)</Text>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  value={dataInicioDate}
                  onChangeText={setDataInicioDate}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={dataInicioTime}
                  onChangeText={setDataInicioTime}
                  editable={!loading}
                />
              </View>
            </View>

            <Text style={styles.label}>Data de Término *</Text>
            <View style={styles.dateShortcuts}>
              <TouchableOpacity
                style={styles.shortcutButton}
                onPress={setDateToday}
                disabled={loading}>
                <Text style={styles.shortcutText}>Hoje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutButton}
                onPress={setDateTomorrow}
                disabled={loading}>
                <Text style={styles.shortcutText}>Amanhã</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutButton}
                onPress={setDateNextWeek}
                disabled={loading}>
                <Text style={styles.shortcutText}>+7 dias</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  value={dataFimDate}
                  onChangeText={setDataFimDate}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={dataFimTime}
                  onChangeText={setDataFimTime}
                  editable={!loading}
                />
              </View>
            </View>

            <Text style={styles.label}>Local</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: São Paulo, SP"
              value={local}
              onChangeText={setLocal}
              editable={!loading}
            />

            <Text style={styles.label}>Método de Pagamento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dinheiro, Pix, Cartão"
              value={metodoPagamento}
              onChangeText={setMetodoPagamento}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Criar Serviço</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  categoriesScroll: {
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#2196F3',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfColumn: {
    flex: 1,
  },
  dateShortcuts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  shortcutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  shortcutText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default CreateServiceScreen;
