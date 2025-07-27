import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';
import { type Notification } from '../types';

// Mock notification data
const mockNotification1: Notification = {
  id: 1,
  title: 'New Message',
  message: 'You have received a new message',
  type: 'info',
  userId: 1,
  read: false,
  createdAt: '2024-01-01T10:00:00Z',
  actionUrl: '/chat',
};

const mockNotification2: Notification = {
  id: 2,
  title: 'Employee Added',
  message: 'A new employee has been added to the system',
  type: 'success',
  userId: 1,
  read: true,
  createdAt: '2024-01-01T11:00:00Z',
};

const mockNotification3: Notification = {
  id: 3,
  title: 'System Alert',
  message: 'System maintenance scheduled for tonight',
  type: 'warning',
  userId: 1,
  read: false,
  createdAt: '2024-01-01T12:00:00Z',
};

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationStore.getState().clearNotifications();
    useNotificationStore.getState().setLoading(false);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNotificationStore.getState();

      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Notification Management', () => {
    it('should set notifications correctly', () => {
      const { setNotifications } = useNotificationStore.getState();
      const notifications = [
        mockNotification1,
        mockNotification2,
        mockNotification3,
      ];

      setNotifications(notifications);

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(notifications);
      expect(state.unreadCount).toBe(2); // mockNotification1 and mockNotification3 are unread
    });

    it('should add notification correctly', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification(mockNotification1);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toEqual(mockNotification1);
      expect(state.unreadCount).toBe(1);
    });

    it('should add notification to the beginning of the list', () => {
      const { setNotifications, addNotification } =
        useNotificationStore.getState();

      setNotifications([mockNotification2]);
      addNotification(mockNotification1);

      const state = useNotificationStore.getState();
      expect(state.notifications[0]).toEqual(mockNotification1);
      expect(state.notifications[1]).toEqual(mockNotification2);
    });

    it('should update notification correctly', () => {
      const { setNotifications, updateNotification } =
        useNotificationStore.getState();

      setNotifications([mockNotification1, mockNotification2]);

      updateNotification(1, { read: true, title: 'Updated Title' });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[0].title).toBe('Updated Title');
      expect(state.unreadCount).toBe(0); // Both notifications are now read
    });

    it('should remove notification correctly', () => {
      const { setNotifications, removeNotification } =
        useNotificationStore.getState();

      setNotifications([
        mockNotification1,
        mockNotification2,
        mockNotification3,
      ]);

      removeNotification(2);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications.find(n => n.id === 2)).toBeUndefined();
      expect(state.unreadCount).toBe(2); // mockNotification1 and mockNotification3 are still unread
    });

    it('should mark notification as read', () => {
      const { setNotifications, markAsRead } = useNotificationStore.getState();

      setNotifications([mockNotification1]);

      markAsRead(1);

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      const { setNotifications, markAllAsRead } =
        useNotificationStore.getState();

      setNotifications([mockNotification1, mockNotification3]); // Both unread

      markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every(n => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should clear all notifications', () => {
      const { setNotifications, clearNotifications } =
        useNotificationStore.getState();

      setNotifications([
        mockNotification1,
        mockNotification2,
        mockNotification3,
      ]);

      clearNotifications();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('Unread Count Management', () => {
    it('should set unread count correctly', () => {
      const { setUnreadCount } = useNotificationStore.getState();

      setUnreadCount(5);

      expect(useNotificationStore.getState().unreadCount).toBe(5);
    });

    it('should update unread count when notifications change', () => {
      const { setNotifications } = useNotificationStore.getState();

      // Set notifications with mixed read status
      setNotifications([
        { ...mockNotification1, read: false },
        { ...mockNotification2, read: true },
        { ...mockNotification3, read: false },
      ]);

      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  describe('Loading State', () => {
    it('should set loading state correctly', () => {
      const { setLoading } = useNotificationStore.getState();

      setLoading(true);
      expect(useNotificationStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      useNotificationStore.getState().setNotifications([
        mockNotification1, // unread
        mockNotification2, // read
        mockNotification3, // unread
      ]);
    });

    it('should get unread notifications correctly', () => {
      const { getUnreadNotifications } = useNotificationStore.getState();

      const unreadNotifications = getUnreadNotifications();

      expect(unreadNotifications).toHaveLength(2);
      expect(unreadNotifications).toContain(mockNotification1);
      expect(unreadNotifications).toContain(mockNotification3);
      expect(unreadNotifications).not.toContain(mockNotification2);
    });

    it('should get notification by id correctly', () => {
      const { getNotificationById } = useNotificationStore.getState();

      const notification = getNotificationById(2);

      expect(notification).toEqual(mockNotification2);
    });

    it('should return undefined for non-existent notification id', () => {
      const { getNotificationById } = useNotificationStore.getState();

      const notification = getNotificationById(999);

      expect(notification).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating non-existent notification', () => {
      const { updateNotification } = useNotificationStore.getState();

      // Should not throw error
      updateNotification(999, { read: true });

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it('should handle removing non-existent notification', () => {
      const { removeNotification } = useNotificationStore.getState();

      // Should not throw error
      removeNotification(999);

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it('should handle marking non-existent notification as read', () => {
      const { markAsRead } = useNotificationStore.getState();

      // Should not throw error
      markAsRead(999);

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it('should handle empty notifications array', () => {
      const { getUnreadNotifications, markAllAsRead } =
        useNotificationStore.getState();

      const unreadNotifications = getUnreadNotifications();
      expect(unreadNotifications).toEqual([]);

      // Should not throw error
      markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });
});
