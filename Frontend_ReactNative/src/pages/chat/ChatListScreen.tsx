import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useWebSocket} from '../../contexts/WebSocketContext';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';
import {chatService} from '../../api/services/chatService';
import type {ChatRoom} from '../../types/api.types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ChatStackParamList} from '../../types/navigation.types';

type ChatListNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const {connectionStatus, connect} = useWebSocket();
  const {user} = useAuth();
  const navigation = useNavigation<ChatListNavigationProp>();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChatRooms = useCallback(async () => {
    try {
      const data = await chatService.getRooms();
      
      // Compute otherUserId and otherUserName for each room
      const enrichedRooms = data.map(room => {
        const isCliente = user?.id === room.clienteId;
        return {
          ...room,
          otherUserId: isCliente ? room.prestadorId : room.clienteId,
          otherUserName: isCliente ? room.prestadorNome : room.clienteNome,
        };
      });
      
      setRooms(enrichedRooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load rooms on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadChatRooms();
      connect(); // Ensure WebSocket is connected
    }, [loadChatRooms, connect]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChatRooms();
  };

  const handleRoomPress = (room: ChatRoom) => {
    if (!room.otherUserId || !room.otherUserName) return;
    
    navigation.navigate('Chat', {
      otherUserId: room.otherUserId,
      otherUserName: room.otherUserName,
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      case 'disconnected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const renderRoom = ({item}: {item: ChatRoom}) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleRoomPress(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.otherUserName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.roomContent}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.otherUserName || 'Desconhecido'}
          </Text>
          {item.lastMessage && (
            <Text style={styles.roomTime}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        
        <View style={styles.roomFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.message || 'Sem mensagens'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

  const handleNewChat = () => {
    navigation.navigate('Chat', {
      otherUserId: 0, // Indica modo de seleção
      otherUserName: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Subtle connection status bar */}
      <View style={[styles.statusBar, {backgroundColor: getStatusColor()}]} />
      
      {rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
          <Text style={styles.emptyText}>
            Suas conversas com prestadores aparecerão aqui
          </Text>
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Text style={styles.newChatButtonText}>+ Nova Conversa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={rooms}
            renderItem={renderRoom}
            keyExtractor={(item, index) => `${item.otherUserId}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    height: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  roomCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  roomContent: {
    flex: 1,
    justifyContent: 'center',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  roomTime: {
    fontSize: 12,
    color: '#999',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});

export default ChatListScreen;
