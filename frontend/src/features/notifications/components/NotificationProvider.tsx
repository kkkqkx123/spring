import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { webSocketService } from '../../../services/websocket';
import { useNotificationStore } from '../../../stores/notificationStore';
import { notificationApi } from '../services/notificationApi';
import { notifications } from '@mantine/notifications';

interface NotificationContextValue {
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: number) => Promise<void>;
  cleanupOldNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export interface NotificationProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
}

export function NotificationProvider({
  children,
  autoConnect = true,
  showConnectionStatus = true,
}: NotificationProviderProps) {
  const realTimeNotifications = useRealTimeNotifications();
  const { setNotifications, setLoading } = useNotificationStore();

  // Initialize WebSocket connection
  useEffect(() => {
    if (autoConnect) {
      const initializeConnection = async () => {
        try {
          await webSocketService.connect();
          
          // Load initial notifications from API
          setLoading(true);
          const response = await notificationApi.getNotifications({
            page: 0,
            size: 50,
          });
          setNotifications(response.content);
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
          if (showConnectionStatus) {
            notifications.show({
              title: 'Connection Error',
              message: 'Failed to connect to notification service',
              color: 'red',
            });
          }
        } finally {
          setLoading(false);
        }
      };

      initializeConnection();
    }

    return () => {
      if (autoConnect) {
        webSocketService.disconnect();
      }
    };
  }, [autoConnect, showConnectionStatus, setNotifications, setLoading]);

  // Show connection status notifications
  useEffect(() => {
    if (!showConnectionStatus) return;

    const unsubscribeConnect = webSocketService.subscribe('connect', () => {
      notifications.show({
        title: 'Connected',
        message: 'Real-time notifications are now active',
        color: 'green',
        autoClose: 3000,
      });
    });

    const unsubscribeDisconnect = webSocketService.subscribe(
      'disconnect',
      (reason: string) => {
        notifications.show({
          title: 'Disconnected',
          message: `Connection lost: ${reason}. Attempting to reconnect...`,
          color: 'yellow',
          autoClose: 5000,
        });
      }
    );

    const unsubscribeReconnect = webSocketService.subscribe(
      'reconnect',
      (attemptNumber: number) => {
        notifications.show({
          title: 'Reconnected',
          message: `Connection restored after ${attemptNumber} attempts`,
          color: 'green',
          autoClose: 3000,
        });
      }
    );

    const unsubscribeReconnectFailed = webSocketService.subscribe(
      'reconnect_failed',
      () => {
        notifications.show({
          title: 'Connection Failed',
          message: 'Unable to reconnect to notification service. Please refresh the page.',
          color: 'red',
          autoClose: false,
        });
      }
    );

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeReconnect();
      unsubscribeReconnectFailed();
    };
  }, [showConnectionStatus]);

  const contextValue: NotificationContextValue = {
    isConnected: realTimeNotifications.isConnected,
    connectionState: realTimeNotifications.connectionState,
    markAsRead: realTimeNotifications.markAsRead,
    markAllAsRead: realTimeNotifications.markAllAsRead,
    archiveNotification: realTimeNotifications.archiveNotification,
    cleanupOldNotifications: realTimeNotifications.cleanupOldNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
}

// Connection status indicator component
export interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { connectionState } = useNotificationContext();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'disconnected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: `var(--mantine-color-${getStatusColor()}-6)`,
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: `var(--mantine-color-${getStatusColor()}-6)`,
          animation: connectionState === 'connecting' ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {getStatusText()}
    </div>
  );
}