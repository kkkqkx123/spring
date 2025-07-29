import { api } from '../../../services/api';
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
    const response = await api.post('/chat/send', request);
    return response.data;
  }

  // Get conversation with a specific user
  async getConversation(
    userId: number,
    pageable: Pageable
  ): Promise<PaginatedResponse<ChatMessageResponse>> {
    const response = await api.get(`/chat/conversation/${userId}`, {
      params: pageable,
    });
    return response.data;
  }

  // Get list of recent conversations
  async getRecentConversations(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations');
    return response.data;
  }

  // Mark conversation as read
  async markConversationAsRead(userId: number): Promise<number> {
    const response = await api.put(`/chat/conversation/${userId}/read`);
    return response.data;
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/chat/unread/count');
    return response.data;
  }

  // Search messages across conversations
  async searchMessages(
    query: string,
    pageable: Pageable
  ): Promise<PaginatedResponse<ChatMessageResponse>> {
    const response = await api.get('/chat/search', {
      params: { query, ...pageable },
    });
    return response.data;
  }

  // Get online users
  async getOnlineUsers(): Promise<number[]> {
    const response = await api.get('/chat/online-users');
    return response.data;
  }
}

export const chatApi = new ChatApi();
