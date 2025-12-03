import apiClient from '../client';
import type {
  ChatRoom,
  ChatConversation,
  SendMessageRequest,
  ChatMessage,
} from '../../types/api.types';

/**
 * Chat API service (REST endpoints)
 */
export const chatService = {
  /**
   * Get all chat rooms/conversations for authenticated user
   * GET /chat/rooms
   */
  async getRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get<ChatRoom[]>('/chat/rooms');
    return response.data;
  },

  /**
   * Get message history with another user
   * Automatically marks messages as read
   * GET /chat/messages/:otherUserId
   */
  async getMessages(otherUserId: number): Promise<ChatConversation> {
    const response = await apiClient.get<ChatConversation>(
      `/chat/messages/${otherUserId}`,
    );
    return response.data;
  },

  /**
   * Send message via REST (fallback when WebSocket unavailable)
   * POST /chat/messages
   */
  async sendMessage(data: SendMessageRequest): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/chat/messages', data);
    return response.data;
  },
};
