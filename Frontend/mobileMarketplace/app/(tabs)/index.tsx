import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Button,
} from 'react-native';

type Service = {
  id: number;
  nome: string;
  descricao: string;
  valor_minimo: string;
  valor_maximo: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  usuario_id: number;
  metodo_pagamento: string;
  categoria_id: number;
  created_at: string;
  updated_at: string;
};

type User = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  // outras propriedades existem (cpf, senha), mas não iremos exibir por privacidade
};

export default function ServicesListScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // estados para carregar o usuário relacionado ao serviço
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);

  const BASE_URL = 'https://mobile-marketplace-server-1-0-sgvh.onrender.com';
  const SERVICES_ENDPOINT = `${BASE_URL}/services`;
  const USERS_ENDPOINT = `${BASE_URL}/users`;

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(SERVICES_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Service[] = await res.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao buscar serviços');
    } finally {
      setLoading(false);
    }
  }

  // busca os usuários e filtra pelo id do usuario relacionado ao serviço.
  // usamos o mesmo host que /services, mas trocando para /users conforme solicitado.
  async function fetchUserForService(userId: number) {
    try {
      setUserLoading(true);
      setUserError(null);
      setSelectedUser(null);
      const res = await fetch(USERS_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const users: User[] = await res.json();
      const found = users.find((u) => u.id === userId) ?? null;
      if (!found) setUserError('Usuário não encontrado');
      setSelectedUser(found);
    } catch (err: any) {
      setUserError(err.message ?? 'Erro ao buscar usuário');
    } finally {
      setUserLoading(false);
    }
  }

  // Ao abrir o modal vamos setar o serviço selecionado e iniciar a busca do usuário
  function openService(svc: Service) {
    setSelected(svc);
    setModalVisible(true);
    fetchUserForService(svc.usuario_id);
  }

  // Ao fechar limpa estados de usuário também
  function closeModal() {
    setModalVisible(false);
    setSelected(null);
    setSelectedUser(null);
    setUserError(null);
    setUserLoading(false);
  }

  function fmtPrice(value: string) {
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return `R$ ${n.toFixed(2).replace('.', ',')}`;
  }

  function fmtDate(iso?: string) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  }

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity style={styles.card} onPress={() => openService(item)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.title}>{item.nome}</Text>
        <Text style={styles.priceRange}>
          {fmtPrice(item.valor_minimo)} - {fmtPrice(item.valor_maximo)}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.subtitle}>
        {item.descricao}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.local}</Text>
        <Text style={styles.meta}>{item.metodo_pagamento}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Serviços</Text>
        <Button title="Atualizar" onPress={fetchServices} />
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
          <Text>Carregando serviços...</Text>
        </View>
      )}

      {error && (
        <View style={styles.loadingWrap}>
          <Text style={{ color: 'red' }}>{error}</Text>
          <Button title="Tentar novamente" onPress={fetchServices} />
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {selected ? (
              <>
                <Text style={styles.modalTitle}>{selected.nome}</Text>
                <Text style={styles.modalLabel}>Descrição</Text>
                <Text style={styles.modalText}>{selected.descricao}</Text>

                <View style={{ height: 12 }} />
                <Text style={styles.modalLabel}>Preço</Text>
                <Text style={styles.modalText}>
                  {fmtPrice(selected.valor_minimo)} — {fmtPrice(selected.valor_maximo)}
                </Text>

                <View style={{ height: 12 }} />
                <Text style={styles.modalLabel}>Quando</Text>
                <Text style={styles.modalText}>Início: {fmtDate(selected.data_inicio)}</Text>
                <Text style={styles.modalText}>Fim: {fmtDate(selected.data_fim)}</Text>

                <View style={{ height: 12 }} />
                <Text style={styles.modalLabel}>Local</Text>
                <Text style={styles.modalText}>{selected.local}</Text>

                <View style={{ height: 12 }} />
                <Text style={styles.modalLabel}>Pagamento</Text>
                <Text style={styles.modalText}>{selected.metodo_pagamento}</Text>

                <View style={{ height: 16 }} />

                <Text style={styles.modalLabel}>Dono do serviço</Text>

                {userLoading && (
                  <View style={{ paddingVertical: 8 }}>
                    <ActivityIndicator />
                    <Text>Carregando dados do usuário...</Text>
                  </View>
                )}

                {userError && (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: 'red' }}>{userError}</Text>
                    <Button title="Recarregar usuário" onPress={() => selected && fetchUserForService(selected.usuario_id)} />
                  </View>
                )}

                {selectedUser && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.modalText, { fontWeight: '700' }]}>{selectedUser.nome}</Text>
                    <Text style={styles.modalText}>Email: {selectedUser.email}</Text>
                    {selectedUser.telefone ? <Text style={styles.modalText}>Telefone: {selectedUser.telefone}</Text> : null}
                    {(selectedUser.cidade || selectedUser.estado) ? (
                      <Text style={styles.modalText}>Local: {selectedUser.cidade ?? ''}{selectedUser.estado ? ` - ${selectedUser.estado}` : ''}</Text>
                    ) : null}
                  </View>
                )}

                <View style={{ height: 20 }} />
                <Button title="Fechar" onPress={closeModal} />
              </>
            ) : (
              <ActivityIndicator />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  loadingWrap: { padding: 24, alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#374151' },
  priceRange: { fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { fontSize: 12, color: '#6b7280' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 8 },
  modalText: { fontSize: 15, color: '#1f2937' },
});
