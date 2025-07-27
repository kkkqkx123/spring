import React, { useEffect, useCallback, useRef } from 'react';
import {
  webSocketService,
  eventBus,
  type WebSocketEvents,
} from '../services/websocket';

// Hook for managing WebSocket connection
export const useWebSocket = () => {
  const connectionAttempted = useRef(false);

  const connect = useCallback(async () => {
    if (connectionAttempted.current) return;

    try {
      connectionAttempted.current = true;
      await webSocketService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      connectionAttempted.current = false;
    }
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    connectionAttempted.current = false;
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  const getConnectionState = useCallback(() => {
    return webSocketService.getConnectionState();
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    getConnectionState,
  };
};

// Hook for subscribing to WebSocket events
export const useWebSocketEvent = <K extends keyof WebSocketEvents>(
  event: K,
  callback: WebSocketEvents[K],
  deps: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  useEffect(() => {
    const wrappedCallback = ((...args: any[]) => {
      (callbackRef.current as any)(...args);
    }) as WebSocketEvents[K];

    const unsubscribe = eventBus.subscribe(event, wrappedCallback);

    return unsubscribe;
  }, [event]);
};

// Hook for chat functionality
export const useWebSocketChat = () => {
  const sendMessage = useCallback((recipientId: number, content: string) => {
    try {
      webSocketService.sendChatMessage(recipientId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

  const markMessageAsRead = useCallback((messageId: number) => {
    try {
      webSocketService.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  const sendTypingIndicator = useCallback(
    (recipientId: number, isTyping: boolean) => {
      webSocketService.sendTypingIndicator(recipientId, isTyping);
    },
    []
  );

  return {
    sendMessage,
    markMessageAsRead,
    sendTypingIndicator,
  };
};

// Hook for notification functionality
export const useWebSocketNotifications = () => {
  const markNotificationAsRead = useCallback((notificationId: number) => {
    try {
      webSocketService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  return {
    markNotificationAsRead,
  };
};

// Hook for connection status monitoring
export const useWebSocketStatus = () => {
  const [connectionState, setConnectionState] = React.useState(
    webSocketService.getConnectionState()
  );
  const [lastError, setLastError] = React.useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);

  useWebSocketEvent('connect', () => {
    setConnectionState('connected');
    setLastError(null);
    setReconnectAttempts(0);
  });

  useWebSocketEvent('disconnect', () => {
    setConnectionState('disconnected');
  });

  useWebSocketEvent('error', error => {
    setLastError(error);
  });

  useWebSocketEvent('reconnect_attempt', attemptNumber => {
    setConnectionState('connecting');
    setReconnectAttempts(attemptNumber);
  });

  useWebSocketEvent('reconnect', () => {
    setConnectionState('connected');
    setLastError(null);
  });

  useWebSocketEvent('reconnect_failed', () => {
    setConnectionState('disconnected');
  });

  return {
    connectionState,
    lastError,
    reconnectAttempts,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
  };
};

// Hook for real-time chat messages
export const useRealTimeChat = (currentUserId: number) => {
  const [messages, setMessages] = React.useState<Map<number, any[]>>(new Map());
  const [typingUsers, setTypingUsers] = React.useState<Map<number, string>>(
    new Map()
  );
  const [onlineUsers, setOnlineUsers] = React.useState<Set<number>>(new Set());

  useWebSocketEvent('chat:new-message', message => {
    setMessages(prev => {
      const newMessages = new Map(prev);
      const conversationId =
        message.senderId === currentUserId
          ? message.recipientId
          : message.senderId;
      const conversationMessages = newMessages.get(conversationId) || [];
      newMessages.set(conversationId, [...conversationMessages, message]);
      return newMessages;
    });
  });

  useWebSocketEvent('chat:typing', ({ userId, userName, isTyping }) => {
    if (userId === currentUserId) return; // Don't show own typing indicator

    setTypingUsers(prev => {
      const newTypingUsers = new Map(prev);
      if (isTyping) {
        newTypingUsers.set(userId, userName);
      } else {
        newTypingUsers.delete(userId);
      }
      return newTypingUsers;
    });
  });

  useWebSocketEvent('chat:user-online', ({ userId, isOnline }) => {
    setOnlineUsers(prev => {
      const newOnlineUsers = new Set(prev);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return newOnlineUsers;
    });
  });

  const getConversationMessages = useCallback(
    (userId: number) => {
      return messages.get(userId) || [];
    },
    [messages]
  );

  const isUserTyping = useCallback(
    (userId: number) => {
      return typingUsers.has(userId);
    },
    [typingUsers]
  );

  const getTypingUserName = useCallback(
    (userId: number) => {
      return typingUsers.get(userId);
    },
    [typingUsers]
  );

  const isUserOnline = useCallback(
    (userId: number) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  return {
    messages,
    typingUsers,
    onlineUsers,
    getConversationMessages,
    isUserTyping,
    getTypingUserName,
    isUserOnline,
  };
};

// Hook for real-time notifications
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  useWebSocketEvent('notification:new', notification => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  });

  useWebSocketEvent('notification:read', ({ notificationId }) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  });

  useWebSocketEvent('notification:count-updated', ({ count }) => {
    setUnreadCount(count);
  });

  const markAsRead = useCallback((notificationId: number) => {
    webSocketService.markNotificationAsRead(notificationId);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
};
