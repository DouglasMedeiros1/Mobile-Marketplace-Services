import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {AppState} from 'react-native';
import {WS_BASE_URL} from '@env';
import {useAuth} from './AuthContext';
import type {WSMessage} from '../types/api.types';

// Fallback to default if env variable is not loaded
const wsBaseUrl = WS_BASE_URL || 'ws://10.0.2.2:3000';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type MessageHandler = (message: WSMessage) => void;

interface WebSocketContextData {
  connectionStatus: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WSMessage) => void;
  addMessageHandler: (handler: MessageHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextData>(
  {} as WebSocketContextData,
);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const {token, isAuthenticated} = useAuth();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());
  const manualDisconnectRef = useRef(false);
  const isConnectingRef = useRef(false);
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    // Don't connect if not authenticated or no token
    if (!token || !isAuthenticated) {
      console.log('⚠️ WebSocket: Cannot connect - not authenticated');
      return;
    }

    // Don't create duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket: Already connected');
      return;
    }

    // Don't connect if already connecting
    if (wsRef.current?.readyState === WebSocket.CONNECTING || isConnectingRef.current) {
      console.log('⏳ WebSocket: Already connecting, skipping...');
      return;
    }

    manualDisconnectRef.current = false;
    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    
    console.log('🔄 WebSocket: Attempting connection...');
    console.log(`   Base URL: ${wsBaseUrl}`);
    console.log(`   Auth: ${token ? 'Token present' : 'No token'}`);

    try {
      const wsUrl = `${wsBaseUrl}/chat?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket: Connected successfully');
        setConnectionStatus('connected');
        isConnectingRef.current = false;
      };

      ws.onmessage = event => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('📨 WebSocket: Message received:', message.type || 'unknown');
          
          // Notify all registered handlers
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('❌ Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = error => {
        console.error('❌ WebSocket: Error occurred');
        isConnectingRef.current = false;
      };

      ws.onclose = event => {
        console.log('🔌 WebSocket: Connection closed');
        console.log(`   Code: ${event.code}, Manual: ${manualDisconnectRef.current}`);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        isConnectingRef.current = false;
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionStatus('disconnected');
      isConnectingRef.current = false;
    }
  }, [token, isAuthenticated]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('🔌 WebSocket: Manual disconnect requested');
    manualDisconnectRef.current = true;
    isConnectingRef.current = false;

    // Stop auto-reconnect interval
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
      console.log('   Stopped auto-reconnect interval');
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      console.log('   WebSocket closed');
    }

    setConnectionStatus('disconnected');
  }, []);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        console.log('📤 WebSocket: Sending message:', message.type || 'unknown type');
        console.log('   Data:', JSON.stringify(message, null, 2));
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      console.warn(`   ReadyState: ${wsRef.current?.readyState || 'null'}`);
    }
  }, []);

  /**
   * Register a message handler
   * Returns unregister function
   */
  const addMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.add(handler);
    console.log(`🎯 WebSocket: Handler registered (total: ${messageHandlersRef.current.size})`);

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
      console.log(`🎯 WebSocket: Handler unregistered (total: ${messageHandlersRef.current.size})`);
    };
  }, []);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('📱 App: Came to foreground');
        // Auto-reconnect if was previously connected
        if (isAuthenticated && token && connectionStatus === 'disconnected') {
          console.log('🔄 App: Auto-reconnecting WebSocket...');
          setTimeout(() => connect(), 500);
        }
      } else if (nextAppState === 'background') {
        console.log('📱 App: Going to background');
        // Keep connection alive in background for notifications
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connect, isAuthenticated, token, connectionStatus]);

  /**
   * Setup auto-reconnect interval (every 1 minute)
   * Only active when authenticated but not connected
   */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    // Start interval to attempt reconnection every 1 minute if disconnected
    reconnectIntervalRef.current = setInterval(() => {
      if (connectionStatus === 'disconnected' && !manualDisconnectRef.current) {
        console.log('⏰ Auto-reconnect interval: Attempting to reconnect...');
        connect();
      }
    }, 60000); // 1 minute

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, token, connectionStatus, connect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        connect,
        disconnect,
        sendMessage,
        addMessageHandler,
      }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  return context;
};
