import { apiClient } from '../../../services/api';
import type {
  ChatMessage,
  Conversation,
  PaginatedResponse,
  Pageable,
} from '../../../types';

export interface ChatMessageRequest {
  recipientId: number;
  content: string;
}

export interface ChatMessageResponse extends ChatMessage {}

export interface ConversationSearchParams {
  query?: string;
}

export class ChatApi {
  // Send a new message
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    return await apiClient.post('/chat/send', request);
  }

  // Get conversation with a specific user
  async getConversation(
    userId: number,
    pageable: Pageable
  ): Promise<PaginatedResponse<ChatMessageResponse>> {
    return await apiClient.get(`/chat/conversation/${userId}`, {
      params: pageable,
    });
  }

  // Get list of recent conversations
  async getRecentConversations(): Promise<Conversation[]> {
    return await apiClient.get('/chat/conversations');
  }

  // Mark conversation as read
  async markConversationAsRead(userId: number): Promise<number> {
    return await apiClient.put(`/chat/conversation/${userId}/read`);
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    return await apiClient.get('/chat/unread/count');
  }

  // Search messages across conversations
  async searchMessages(
    query: string,
    pageable: Pageable
  ): Promise<PaginatedResponse<ChatMessageResponse>> {
    return await apiClient.get('/chat/search', {
      params: { query, ...pageable },
    });
  }

  // Get online users
  async getOnlineUsers(): Promise<number[]> {
    return await apiClient.get('/chat/online-users');
  }
}

export const chatApi = new ChatApi();
