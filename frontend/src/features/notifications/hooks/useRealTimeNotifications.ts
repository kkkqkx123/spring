import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../../../stores/notificationStore';
import { webSocketService } from '../../../services/websocket';
import { useBrowserNotifications } from './useBrowserNotifications';
import { useNotificationPreferences } from './useNotificationPreferences';
import { notificationApi } from '../services/notificationApi';
import type { Notification } from '../../../types';

export interface UseRealTimeNotificationsReturn {
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: number) => Promise<void>;
  cleanupOldNotifications: () => Promise<void>;
}

export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const {
    addNotification,
    updateNotification,
    setUnreadCount,
    removeNotification,
    notifications,
  } = useNotificationStore();

  const { showBrowserNotification, permission } = useBrowserNotifications();
  const { preferences, isInQuietHours, shouldShowNotification } =
    useNotificationPreferences();

  // Handle new notifications from WebSocket
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      // Add to store
      addNotification(notification);

      // Check if we should show this notification type
      if (!shouldShowNotification(notification.type)) {
        return;
      }

      // Show browser notification if enabled and not in quiet hours
      if (
        preferences.browserNotifications &&
        permission === 'granted' &&
        !isInQuietHours()
      ) {
        showBrowserNotification(notification);
      }

      // Play sound if enabled and not in quiet hours
      if (preferences.soundEnabled && !isInQuietHours()) {
        playNotificationSound(notification.type);
      }
    },
    [
      addNotification,
      shouldShowNotification,
      preferences.browserNotifications,
      preferences.soundEnabled,
      permission,
      isInQuietHours,
      showBrowserNotification,
    ]
  );

  // Handle notification read status updates
  const handleNotificationRead = useCallback(
    (data: { notificationId: number }) => {
      updateNotification(data.notificationId, { read: true });
    },
    [updateNotification]
  );

  // Handle unread count updates
  const handleUnreadCountUpdate = useCallback(
    (data: { count: number }) => {
      setUnreadCount(data.count);
    },
    [setUnreadCount]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        // Update locally first for immediate feedback
        updateNotification(id, { read: true });

        // Send to server via WebSocket
        webSocketService.markNotificationAsRead(id);

        // Also update via API as fallback
        await notificationApi.markAsRead(id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert local change on error
        updateNotification(id, { read: false });
        throw error;
      }
    },
    [updateNotification]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Update all locally first
      notifications.forEach(notification => {
        if (!notification.read) {
          updateNotification(notification.id, { read: true });
        }
      });

      // Send to server
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert local changes on error
      notifications.forEach(notification => {
        if (!notification.read) {
          updateNotification(notification.id, { read: false });
        }
      });
      throw error;
    }
  }, [notifications, updateNotification, setUnreadCount]);

  // Archive notification (soft delete)
  const archiveNotification = useCallback(
    async (id: number) => {
      try {
        // Remove from local store
        removeNotification(id);

        // Delete from server
        await notificationApi.deleteNotification(id);
      } catch (error) {
        console.error('Error archiving notification:', error);
        throw error;
      }
    },
    [removeNotification]
  );

  // Clean up old notifications (older than 30 days)
  const cleanupOldNotifications = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Remove old notifications from local store
      const oldNotifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate < thirtyDaysAgo && notification.read;
      });

      oldNotifications.forEach(notification => {
        removeNotification(notification.id);
      });

      // Clean up on server
      await notificationApi.deleteAllRead();
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }, [notifications, removeNotification]);

  // Set up WebSocket event listeners
  useEffect(() => {
    const unsubscribeNewNotification = webSocketService.subscribe(
      'notification:new',
      handleNewNotification
    );

    const unsubscribeNotificationRead = webSocketService.subscribe(
      'notification:read',
      handleNotificationRead
    );

    const unsubscribeCountUpdate = webSocketService.subscribe(
      'notification:count-updated',
      handleUnreadCountUpdate
    );

    return () => {
      unsubscribeNewNotification();
      unsubscribeNotificationRead();
      unsubscribeCountUpdate();
    };
  }, [handleNewNotification, handleNotificationRead, handleUnreadCountUpdate]);

  // Auto-cleanup old notifications on mount and periodically
  useEffect(() => {
    // Clean up on mount
    cleanupOldNotifications();

    // Set up periodic cleanup (every 24 hours)
    const cleanupInterval = setInterval(
      cleanupOldNotifications,
      24 * 60 * 60 * 1000
    );

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [cleanupOldNotifications]);

  return {
    isConnected: webSocketService.isConnected(),
    connectionState: webSocketService.getConnectionState(),
    markAsRead,
    markAllAsRead,
    archiveNotification,
    cleanupOldNotifications,
  };
}

// Helper function to play notification sounds
interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function playNotificationSound(type: string): void {
  try {
    // Create audio context if not exists
    const audioContext = new (window.AudioContext ||
      (window as WindowWithAudioContext).webkitAudioContext)();

    // Generate different tones for different notification types
    const frequency = getNotificationFrequency(type);
    const duration = 0.3; // 300ms

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

function getNotificationFrequency(type: string): number {
  switch (type) {
    case 'success':
      return 800; // Higher pitch for success
    case 'warning':
      return 600; // Medium pitch for warning
    case 'error':
      return 400; // Lower pitch for error
    default:
      return 500; // Default pitch for info
  }
}
