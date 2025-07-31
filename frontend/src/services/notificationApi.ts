import { apiClient } from './api';
import type { PaginatedResponse, Pageable } from '../types';

export interface NotificationResponse {
  id: number;
  messageId: number;
  content: string;
  messageType: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface NotificationRequest {
  content: string;
  userId?: number;
  userIds?: number[];
  roleName?: string;
}

export interface NotificationParams extends Pageable {
  unreadOnly?: boolean;
}

export const notificationApi = {
  // Get notifications for current user
  getNotifications: (
    params: NotificationParams = { page: 0, size: 10, unreadOnly: false }
  ): Promise<PaginatedResponse<NotificationResponse>> => {
    return apiClient.get('/api/notifications', { params });
  },

  // Get unread notification count
  getUnreadCount: (): Promise<number> => {
    return apiClient.get('/api/notifications/count');
  },

  // Mark notification as read
  markAsRead: (id: number): Promise<void> => {
    return apiClient.put(`/api/notifications/${id}/read`);
  },

  // Mark multiple notifications as read
  markMultipleAsRead: (ids: number[]): Promise<number> => {
    return apiClient.put('/api/notifications/read', ids);
  },

  // Mark all notifications as read
  markAllAsRead: (): Promise<number> => {
    return apiClient.put('/api/notifications/read-all');
  },

  // Delete notification
  deleteNotification: (id: number): Promise<void> => {
    return apiClient.delete(`/api/notifications/${id}`);
  },

  // Create notification for specific user
  createUserNotification: (
    request: NotificationRequest
  ): Promise<NotificationResponse> => {
    return apiClient.post('/api/notifications/user', request);
  },

  // Create notification for multiple users
  createMultiUserNotification: (
    request: NotificationRequest
  ): Promise<NotificationResponse> => {
    return apiClient.post('/api/notifications/users', request);
  },

  // Create notification for users with specific role
  createRoleNotification: (
    request: NotificationRequest
  ): Promise<NotificationResponse> => {
    return apiClient.post('/api/notifications/role', request);
  },

  // Broadcast notification to all users
  broadcastNotification: (content: string): Promise<NotificationResponse> => {
    return apiClient.post('/api/notifications/broadcast', { content });
  },
};
