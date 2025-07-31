import { useState, useEffect, useCallback } from 'react';
// Using browser's built-in Notification type

export interface UseBrowserNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (notification: Notification) => void;
}

export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const isSupported = 'Notification' in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) {
        return 'denied';
      }

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }, [isSupported]);

  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (!isSupported || permission !== 'granted') {
        return;
      }

      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico', // You can customize this
          badge: '/favicon.ico',
          tag: `notification-${notification.id}`,
          requireInteraction: notification.type === 'error',
          silent: false,
        });

        // Auto-close after 5 seconds for non-error notifications
        if (notification.type !== 'error') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }

        // Handle click events
        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();

          // Navigate to notification URL if available
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        };

        browserNotification.onerror = error => {
          console.error('Browser notification error:', error);
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showBrowserNotification,
  };
}
