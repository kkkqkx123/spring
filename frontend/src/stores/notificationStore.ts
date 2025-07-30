import { create } from 'zustand';
import { type Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastUpdated: string | null;
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
  archiveReadNotifications: () => void;
  getNotificationsByType: (type: string) => Notification[];
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  lastUpdated: null,

  // Actions
  setNotifications: notifications => {
    const unreadCount = notifications.filter(n => !n.read).length;
    set({
      notifications,
      unreadCount,
      lastUpdated: new Date().toISOString(),
    });
  },

  addNotification: notification => {
    set(state => {
      // Avoid duplicates
      const existingIndex = state.notifications.findIndex(
        n => n.id === notification.id
      );
      if (existingIndex !== -1) {
        return state;
      }

      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.read).length;

      return {
        notifications: newNotifications,
        unreadCount,
        lastUpdated: new Date().toISOString(),
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
        lastUpdated: new Date().toISOString(),
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
        lastUpdated: new Date().toISOString(),
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
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      lastUpdated: new Date().toISOString(),
    });
  },

  setUnreadCount: count => {
    set({
      unreadCount: count,
      lastUpdated: new Date().toISOString(),
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

  archiveReadNotifications: () => {
    set(state => {
      const notifications = state.notifications.filter(n => !n.read);
      const unreadCount = notifications.length;

      return {
        notifications,
        unreadCount,
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  getNotificationsByType: type => {
    const { notifications } = get();
    return notifications.filter(n => n.type === type);
  },
}));
