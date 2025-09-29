// app/(tabs)/new-service.tsx

import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../constants/AuthContext';
import { createService } from '../../api/authService'; // Importa a nova função

// Interface baseada nos campos obrigatórios e opcionais do services.js
interface ServiceForm {
  nome: string;
  descricao: string;
  valor_minimo: string; // Usaremos string para o input, converteremos antes de enviar
  valor_maximo: string;
  data_inicio: string; // Exemplo: 2024-12-31 (Para simplificar, use TextInput)
  data_fim: string;
  local: string;
  metodo_pagamento: string;
  categoria_id: string; // ID da Categoria (converter para number)
}

const initialFormState: ServiceForm = {
  nome: '',
  descricao: '',
  valor_minimo: '',
  valor_maximo: '',
  data_inicio: '2025-12-01', // Valor padrão de exemplo
  data_fim: '',
  local: '',
  metodo_pagamento: 'A negociar',
  categoria_id: '1', // ID 1 de exemplo
};


export default function NewServiceScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState<ServiceForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // O ID do usuário logado vem do contexto
  const userId = user?.id;

  const handleChange = (key: keyof ServiceForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // 1. Validação
    if (!userId) {
        Alert.alert("Erro", "Usuário não logado. Por favor, faça login novamente.");
        return;
    }
    const requiredFields = ['nome', 'valor_minimo', 'valor_maximo', 'data_inicio', 'categoria_id'];
    for (const field of requiredFields) {
        if (!form[field as keyof ServiceForm]) {
            Alert.alert("Erro", `O campo '${field}' é obrigatório.`);
            return;
        }
    }

    // 2. Preparação dos Dados (Conversão de tipos e anexo do ID)
    const dataToSend = {
      ...form,
      usuario_id: userId, // ⬅️ ANEXANDO O ID DO USUÁRIO AQUI
      valor_minimo: Number(form.valor_minimo),
      valor_maximo: Number(form.valor_maximo),
      categoria_id: Number(form.categoria_id),
      // O backend aceita null para campos opcionais vazios
      descricao: form.descricao || null,
      data_fim: form.data_fim || null,
      local: form.local || null,
      metodo_pagamento: form.metodo_pagamento || null,
    };

    // 3. Submissão
    setIsSubmitting(true);
    try {
      const result = await createService(dataToSend);
      Alert.alert("Sucesso", `Serviço '${result.nome}' cadastrado com sucesso!`);
      setForm(initialFormState); // Limpa o formulário após o sucesso
    } catch (error: any) {
      console.error("Erro ao cadastrar serviço:", error);
      Alert.alert("Erro", error.message || "Falha ao cadastrar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Campos obrigatórios para renderização
  const formFields: Array<{ key: keyof ServiceForm, label: string, keyboardType?: 'numeric' }> = [
    { key: 'nome', label: 'Nome do Serviço' },
    { key: 'valor_minimo', label: 'Valor Mínimo (R$)', keyboardType: 'numeric' },
    { key: 'valor_maximo', label: 'Valor Máximo (R$)', keyboardType: 'numeric' },
    { key: 'data_inicio', label: 'Data de Início (AAAA-MM-DD)' },
    { key: 'categoria_id', label: 'ID da Categoria', keyboardType: 'numeric' },
    { key: 'descricao', label: 'Descrição (Opcional)' },
    { key: 'data_fim', label: 'Data de Fim (AAAA-MM-DD - Opcional)' },
    { key: 'local', label: 'Local de Execução (Opcional)' },
    { key: 'metodo_pagamento', label: 'Método de Pagamento (Opcional)' },
  ];


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Cadastrar Novo Serviço' }} />
      <Text style={styles.header}>Seu ID de Usuário: {userId}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {formFields.map(({ key, label, keyboardType }) => (
            <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                    style={styles.input}
                    value={form[key]}
                    onChangeText={(text) => handleChange(key, text)}
                    keyboardType={keyboardType || 'default'}
                    placeholder={`Insira ${label.toLowerCase()}`}
                    autoCapitalize={key === 'nome' ? 'words' : 'none'}
                />
            </View>
        ))}

        <Button
          title={isSubmitting ? "Cadastrando..." : "Cadastrar Serviço"}
          onPress={handleSubmit}
          disabled={isSubmitting || !userId}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});