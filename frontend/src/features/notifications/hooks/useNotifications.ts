import { useCallback } from 'react';
import { useNotificationStore } from '../../../stores/notificationStore';
import type { Notification, NotificationType } from '../../../types';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
  getUnreadNotifications: () => Notification[];
  showNotification: (
    title: string,
    message: string,
    type?: NotificationType
  ) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const {
    notifications,
    unreadCount,
    isLoading,
    addNotification: storeAddNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    getUnreadNotifications,
  } = useNotificationStore();

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now() + Math.random(), // Simple ID generation
        createdAt: new Date().toISOString(),
      };
      storeAddNotification(newNotification);
    },
    [storeAddNotification]
  );

  const showNotification = useCallback(
    (title: string, message: string, type: NotificationType = 'info') => {
      addNotification({
        title,
        message,
        type,
        userId: 1, // This should come from auth context
        read: false,
      });
    },
    [addNotification]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    getUnreadNotifications,
    showNotification,
  };
}
