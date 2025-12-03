import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useWebSocket} from '../../contexts/WebSocketContext';
import {useAuth} from '../../contexts/AuthContext';
import {chatService} from '../../api/services/chatService';
import type {ChatMessage, WSMessage} from '../../types/api.types';
import {isNewMessage, isMessageSent} from '../../types/api.types';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import type {ChatStackParamList} from '../../types/navigation.types';

type ChatScreenRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const {user} = useAuth();
  const {connectionStatus, sendMessage, addMessageHandler} = useWebSocket();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  
  const initialOtherUserId = route.params?.otherUserId;
  const initialOtherUserName = route.params?.otherUserName;
  
  const otherUserId = selectedUserId || initialOtherUserId;
  const otherUserName = selectedUserName || initialOtherUserName;

  // Show user selector if otherUserId is 0 (new chat mode)
  useEffect(() => {
    if (initialOtherUserId === 0) {
      setShowUserSelector(true);
      setLoading(false);
    }
  }, [initialOtherUserId]);

  // Load message history on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!otherUserId) {
        setLoading(false);
        return;
      }

      try {
        const conversation = await chatService.getMessages(otherUserId);
        setMessages(conversation.messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [otherUserId]);

  // Register WebSocket message handler
  useEffect(() => {
    const unregister = addMessageHandler((message: WSMessage) => {
      if (isNewMessage(message)) {
        // Only add if from the current conversation
        if (message.data.senderId === otherUserId) {
          setMessages(prev => [...prev, message.data]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
          
          // Mark as read via WebSocket
          sendMessage({
            type: 'mark_read',
            otherUserId: otherUserId,
          });
        }
      } else if (isMessageSent(message)) {
        // Add our own sent message to the list
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m.id === message.data.id);
          if (exists) return prev;
          return [...prev, message.data];
        });
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    });

    return () => unregister();
  }, [addMessageHandler, otherUserId, sendMessage]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: false});
      }, 200);
    }
  }, [loading, messages.length]);

  const handleSelectUser = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowUserSelector(false);
    setLoading(true);
    
    // Load messages with selected user
    chatService.getMessages(userId)
      .then(conversation => {
        setMessages(conversation.messages);
      })
      .catch(error => {
        console.error('Error loading messages:', error);
        Alert.alert('Erro', 'Não foi possível carregar as mensagens');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !otherUserId) {
      return;
    }

    const tempMessage = messageText.trim();
    setMessageText('');

    try {
      // SEMPRE usar REST API (endpoints testados)
      const sentMessage = await chatService.sendMessage({
        otherUserId: otherUserId,
        message: tempMessage,
      });
      
      setMessages(prev => [...prev, sentMessage]);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
      // Restore message text on error
      setMessageText(tempMessage);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#F44336';
      default: return '#999';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isMyMessage = item.senderId === user?.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderNome}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}>
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (showUserSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.selectorHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.selectorTitle}>Escolha um usuário</Text>
        </View>
        
        <View style={styles.userList}>
          <Text style={styles.selectorSubtitle}>Usuários disponíveis para chat:</Text>
          
          {user?.roles?.includes('cliente') && (
            <>
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => handleSelectUser(5, 'João Técnico')}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>J</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>João Técnico</Text>
                  <Text style={styles.userRole}>Prestador • ID: 5</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {user?.roles?.includes('prestador') && (
            <>
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => handleSelectUser(1, 'Maria Silva')}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>M</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>Maria Silva</Text>
                  <Text style={styles.userRole}>Cliente • ID: 1</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => handleSelectUser(2, 'Bobo')}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>B</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>Bobo</Text>
                  <Text style={styles.userRole}>Cliente • ID: 2</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando mensagens...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      
      {/* Subtle connection status bar */}
      <View style={[styles.statusBar, {backgroundColor: getStatusColor()}]} />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>
              Nenhuma mensagem ainda
            </Text>
            <Text style={styles.emptySubtext}>
              Comece a conversa com {otherUserName}
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#999"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    height: 2,
  },
  centerContainer: {
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
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    color: '#000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectorHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 8,
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  selectorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  userList: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
});

export default ChatScreen;
