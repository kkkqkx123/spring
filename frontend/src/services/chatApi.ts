import { apiClient } from './api';
import type {
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  PaginatedResponse,
  Pageable,
  User,
} from '../types';

export interface ConversationParams extends Pageable {
  userId: number;
}

export interface MessageSearchParams extends Pageable {
  query: string;
}

export interface DateRangeParams extends Pageable {
  startDate: string;
  endDate: string;
}

export const chatApi = {
  // Send message via REST
  sendMessage: (request: ChatMessageRequest): Promise<ChatMessageResponse> => {
    return apiClient.post('/api/chat/send', request);
  },

  // Get conversation with another user
  getConversation: (
    userId: number,
    params: Omit<ConversationParams, 'userId'> = { page: 0, size: 20 }
  ): Promise<PaginatedResponse<ChatMessageResponse>> => {
    return apiClient.get(`/api/chat/conversation/${userId}`, { params });
  },

  // Get recent conversations
  getRecentConversations: (): Promise<User[]> => {
    return apiClient.get('/api/chat/conversations');
  },

  // Mark conversation as read
  markConversationAsRead: (userId: number): Promise<number> => {
    return apiClient.put(`/api/chat/conversation/${userId}/read`);
  },

  // Get unread message count
  getUnreadCount: (): Promise<number> => {
    return apiClient.get('/api/chat/unread/count');
  },

  // Get all messages (paginated)
  getAllMessages: (
    params: Pageable = { page: 0, size: 20 }
  ): Promise<PaginatedResponse<ChatMessageResponse>> => {
    return apiClient.get('/api/chat/messages', { params });
  },

  // Create a new message
  createMessage: (messageContent: Partial<ChatMessage>): Promise<ChatMessageResponse> => {
    return apiClient.post('/api/chat/messages', messageContent);
  },

  // Get message by ID
  getMessageById: (id: number): Promise<ChatMessageResponse> => {
    return apiClient.get(`/api/chat/messages/${id}`);
  },

  // Update message
  updateMessage: (id: number, messageContent: Partial<ChatMessage>): Promise<ChatMessageResponse> => {
    return apiClient.put(`/api/chat/messages/${id}`, messageContent);
  },

  // Delete message
  deleteMessage: (id: number): Promise<void> => {
    return apiClient.delete(`/api/chat/messages/${id}`);
  },

  // Get recent messages
  getRecentMessages: (limit: number = 10): Promise<ChatMessageResponse[]> => {
    return apiClient.get('/api/chat/messages/recent', { params: { limit } });
  },

  // Search messages
  searchMessages: (
    query: string,
    params: Omit<MessageSearchParams, 'query'> = { page: 0, size: 20 }
  ): Promise<PaginatedResponse<ChatMessageResponse>> => {
    return apiClient.get('/api/chat/messages/search', { 
      params: { query, ...params } 
    });
  },

  // Get messages by date range
  getMessagesByDateRange: (
    startDate: string,
    endDate: string,
    params: Omit<DateRangeParams, 'startDate' | 'endDate'> = { page: 0, size: 20 }
  ): Promise<PaginatedResponse<ChatMessageResponse>> => {
    return apiClient.get('/api/chat/messages/date-range', {
      params: { startDate, endDate, ...params }
    });
  },
};