import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketService, eventBus } from '../../../services/websocket';
import { queryKeys } from '../../../services/queryKeys';
import { useAuth } from '../../../hooks/useAuth';
import type { ChatMessage, Conversation, PaginatedResponse } from '../../../types';

// Hook for managing real-time chat functionality
export const useRealTimeChat = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());

  // Handle new messages
  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      if (!user) return;

      // Determine which user's conversation this affects
      const otherUserId = message.senderId === user.id 
        ? message.recipientId 
        : message.senderId;

      // Update conversation cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.chat.conversation(otherUserId) },
        (old: PaginatedResponse<ChatMessage> | undefined) => {
          if (!old) return old;
          
          // Check if message already exists to avoid duplicates
          const messageExists = old.content.some(m => m.id === message.id);
          if (messageExists) return old;

          return {
            ...old,
            content: [message, ...old.content],
            totalElements: old.totalElements + 1,
          };
        }
      );

      // Update conversations list
      queryClient.setQueryData(
        queryKeys.chat.conversations,
        (old: Conversation[] | undefined) => {
          if (!old) return old;

          const updatedConversations = old.map(conv => {
            if (conv.userId === otherUserId) {
              return {
                ...conv,
                lastMessage: message,
                unreadCount: message.senderId !== user.id 
                  ? conv.unreadCount + 1 
                  : conv.unreadCount,
              };
            }
            return conv;
          });

          // If conversation doesn't exist, add it
          const conversationExists = old.some(conv => conv.userId === otherUserId);
          if (!conversationExists) {
            const newConversation: Conversation = {
              userId: otherUserId,
              userName: message.senderId === otherUserId 
                ? message.senderName 
                : message.recipientName,
              lastMessage: message,
              unreadCount: message.senderId !== user.id ? 1 : 0,
            };
            return [newConversation, ...updatedConversations];
          }

          return updatedConversations;
        }
      );

      // Update unread count
      if (message.senderId !== user.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
      }
    },
    [user, queryClient]
  );

  // Handle message read status updates
  const handleMessageRead = useCallback(
    (data: { messageId: number; userId: number }) => {
      if (!user) return;

      // Update conversation cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.chat.conversation(data.userId) },
        (old: PaginatedResponse<ChatMessage> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            content: old.content.map(message =>
              message.id === data.messageId
                ? { ...message, read: true }
                : message
            ),
          };
        }
      );
    },
    [user, queryClient]
  );

  // Handle typing indicators
  const handleTyping = useCallback(
    (data: { userId: number; userName: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, data.userName);
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 3000);
      }
    },
    []
  );

  // Handle user online status
  const handleUserOnline = useCallback(
    (data: { userId: number; isOnline: boolean }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });

      // Update online users cache
      queryClient.setQueryData(
        queryKeys.chat.onlineUsers,
        (old: number[] | undefined) => {
          if (!old) return old;
          
          if (data.isOnline) {
            return old.includes(data.userId) ? old : [...old, data.userId];
          } else {
            return old.filter(id => id !== data.userId);
          }
        }
      );
    },
    [queryClient]
  );

  // Set up event listeners
  useEffect(() => {
    const unsubscribeNewMessage = eventBus.subscribe('chat:new-message', handleNewMessage);
    const unsubscribeMessageRead = eventBus.subscribe('chat:message-read', handleMessageRead);
    const unsubscribeTyping = eventBus.subscribe('chat:typing', handleTyping);
    const unsubscribeUserOnline = eventBus.subscribe('chat:user-online', handleUserOnline);

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageRead();
      unsubscribeTyping();
      unsubscribeUserOnline();
    };
  }, [handleNewMessage, handleMessageRead, handleTyping, handleUserOnline]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (recipientId: number, isTyping: boolean) => {
      try {
        webSocketService.sendTypingIndicator(recipientId, isTyping);
      } catch (error) {
        console.warn('Failed to send typing indicator:', error);
      }
    },
    []
  );

  // Send message via WebSocket
  const sendMessage = useCallback(
    (recipientId: number, content: string) => {
      try {
        webSocketService.sendChatMessage(recipientId, content);
      } catch (error) {
        console.error('Failed to send message via WebSocket:', error);
        throw error;
      }
    },
    []
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: number) => {
      try {
        webSocketService.markMessageAsRead(messageId);
      } catch (error) {
        console.warn('Failed to mark message as read:', error);
      }
    },
    []
  );

  return {
    onlineUsers,
    typingUsers,
    sendTypingIndicator,
    sendMessage,
    markAsRead,
    isConnected: webSocketService.isConnected(),
    connectionState: webSocketService.getConnectionState(),
  };
};

// Hook for managing typing indicator state
export const useTypingIndicator = (recipientId: number, delay = 1000) => {
  const [isTyping, setIsTyping] = useState(false);
  const { sendTypingIndicator } = useRealTimeChat();

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(recipientId, true);
    }
  }, [isTyping, recipientId, sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(recipientId, false);
    }
  }, [isTyping, recipientId, sendTypingIndicator]);

  // Auto-stop typing after delay
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        stopTyping();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [isTyping, delay, stopTyping]);

  return {
    isTyping,
    startTyping,
    stopTyping,
  };
};