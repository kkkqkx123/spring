import { create } from 'zustand';
import { type Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationActions {
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: number, updates: Partial<Notification>) => void;
  removeNotification: (id: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  getUnreadNotifications: () => Notification[];
  getNotificationById: (id: number) => Notification | undefined;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Actions
  setNotifications: notifications => {
    const unreadCount = notifications.filter(n => !n.read).length;
    set({
      notifications,
      unreadCount,
    });
  },

  addNotification: notification => {
    set(state => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.read).length;

      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  updateNotification: (id, updates) => {
    set(state => {
      const notifications = state.notifications.map(notification =>
        notification.id === id ? { ...notification, ...updates } : notification
      );
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        notifications,
        unreadCount,
      };
    });
  },

  removeNotification: id => {
    set(state => {
      const notifications = state.notifications.filter(n => n.id !== id);
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        notifications,
        unreadCount,
      };
    });
  },

  markAsRead: id => {
    const { updateNotification } = get();
    updateNotification(id, { read: true });
  },

  markAllAsRead: () => {
    set(state => {
      const notifications = state.notifications.map(notification => ({
        ...notification,
        read: true,
      }));

      return {
        notifications,
        unreadCount: 0,
      };
    });
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  setUnreadCount: count => {
    set({
      unreadCount: count,
    });
  },

  setLoading: loading => {
    set({
      isLoading: loading,
    });
  },

  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter(n => !n.read);
  },

  getNotificationById: id => {
    const { notifications } = get();
    return notifications.find(n => n.id === id);
  },
}));
