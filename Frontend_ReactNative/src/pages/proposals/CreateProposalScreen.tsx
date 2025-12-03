import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {CreateProposalRouteProp, ProposalsNavigationProp} from '../../types/navigation.types';
import {proposalsService} from '../../api/services/proposalsService';

const CreateProposalScreen: React.FC = () => {
  const route = useRoute<CreateProposalRouteProp>();
  const navigation = useNavigation<ProposalsNavigationProp>();
  const {serviceId} = route.params;
  
  const [valor, setValor] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!valor || parseFloat(valor) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    if (!mensagem.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma mensagem para o cliente');
      return;
    }

    setLoading(true);
    try {
      await proposalsService.createProposal({
        service_id: serviceId,
        valor: parseFloat(valor),
        mensagem: mensagem.trim(),
      });

      Alert.alert(
        'Sucesso',
        'Proposta enviada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao enviar proposta');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (text: string) => {
    // Remove non-numeric characters except comma and dot
    const numericText = text.replace(/[^0-9.,]/g, '');
    setValor(numericText);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Envie sua proposta com um valor competitivo e uma mensagem convincente para o cliente.
        </Text>
      </View>

      {/* Valor Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Valor da Proposta <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={valor}
            onChangeText={formatCurrency}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>
        <Text style={styles.hint}>Digite o valor que você cobrará por este serviço</Text>
      </View>

      {/* Mensagem Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Mensagem para o Cliente <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva sua experiência, disponibilidade e por que você é a melhor escolha..."
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!loading}
        />
        <Text style={styles.hint}>
          {mensagem.length} caracteres (mínimo recomendado: 50)
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Enviar Proposta</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateProposalScreen;
