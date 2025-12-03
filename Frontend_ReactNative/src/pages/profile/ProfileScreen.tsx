import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import type {ProfileNavigationProp} from '../../types/navigation.types';
import {useNavigation} from '@react-navigation/native';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const {user, logout} = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.nome}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <View style={styles.rolesContainer}>
          {user?.roles.map(role => (
            <View key={role} style={styles.roleBadge}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('NotificationPreferences')}>
          <Text style={styles.notificationButtonText}>📊 Relatórios Periódicos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações</Text>
        
        {user?.telefone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefone:</Text>
            <Text style={styles.infoValue}>{user.telefone}</Text>
          </View>
        )}
        
        {user?.bio && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio:</Text>
            <Text style={styles.infoValue}>{user.bio}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
