import { apiClient } from '../../../services/api';
import { Notification, PaginatedResponse, Pageable } from '../../../types';

export interface NotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: number;
  actionUrl?: string;
}

export interface NotificationUpdateRequest {
  read?: boolean;
}

export class NotificationApi {
  constructor(private client: typeof apiClient) {}

  async getNotifications(
    pageable: Pageable
  ): Promise<PaginatedResponse<Notification>> {
    const response = await this.client.get('/api/notifications', {
      params: pageable,
    });
    return response.data;
  }

  async getNotification(id: number): Promise<Notification> {
    const response = await this.client.get(`/api/notifications/${id}`);
    return response.data;
  }

  async createNotification(
    notification: NotificationRequest
  ): Promise<Notification> {
    const response = await this.client.post('/api/notifications', notification);
    return response.data;
  }

  async updateNotification(
    id: number,
    updates: NotificationUpdateRequest
  ): Promise<Notification> {
    const response = await this.client.put(`/api/notifications/${id}`, updates);
    return response.data;
  }

  async deleteNotification(id: number): Promise<void> {
    await this.client.delete(`/api/notifications/${id}`);
  }

  async markAsRead(id: number): Promise<Notification> {
    const response = await this.client.put(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    await this.client.put('/api/notifications/read-all');
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.client.get('/api/notifications/unread/count');
    return response.data;
  }

  async deleteAllRead(): Promise<void> {
    await this.client.delete('/api/notifications/read');
  }

  async searchNotifications(
    query: string,
    pageable: Pageable
  ): Promise<PaginatedResponse<Notification>> {
    const response = await this.client.get('/api/notifications/search', {
      params: { q: query, ...pageable },
    });
    return response.data;
  }
}

// Create singleton instance
export const notificationApi = new NotificationApi(apiClient);
