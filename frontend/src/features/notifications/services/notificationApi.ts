import { apiClient } from '../../../services/api';
import type { Notification, PaginatedResponse, Pageable } from '../../../types';

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
    try {
      const response: { data: PaginatedResponse<Notification> } =
        await this.client.get('/api/notifications', {
          params: pageable,
        });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotification(id: number): Promise<Notification> {
    try {
      const response: { data: Notification } = await this.client.get(
        `/api/notifications/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching notification ${id}:`, error);
      throw error;
    }
  }

  async createNotification(
    notification: NotificationRequest
  ): Promise<Notification> {
    try {
      const response: { data: Notification } = await this.client.post(
        '/api/notifications',
        notification
      );
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async updateNotification(
    id: number,
    updates: NotificationUpdateRequest
  ): Promise<Notification> {
    try {
      const response: { data: Notification } = await this.client.put(
        `/api/notifications/${id}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating notification ${id}:`, error);
      throw error;
    }
  }

  async deleteNotification(id: number): Promise<void> {
    try {
      await this.client.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  }

  async markAsRead(id: number): Promise<Notification> {
    try {
      const response: { data: Notification } = await this.client.put(
        `/api/notifications/${id}/read`
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.client.put('/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response: { data: number } = await this.client.get(
        '/api/notifications/unread/count'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  async deleteAllRead(): Promise<void> {
    try {
      await this.client.delete('/api/notifications/read');
    } catch (error) {
      console.error('Error deleting all read notifications:', error);
      throw error;
    }
  }

  async searchNotifications(
    query: string,
    pageable: Pageable
  ): Promise<PaginatedResponse<Notification>> {
    try {
      const response: { data: PaginatedResponse<Notification> } =
        await this.client.get('/api/notifications/search', {
          params: { q: query, ...pageable },
        });
      return response.data;
    } catch (error) {
      console.error('Error searching notifications:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const notificationApi = new NotificationApi(apiClient);
