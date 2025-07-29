import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/chatApi';
import { queryKeys } from '../../../services/queryKeys';
import type { Pageable, ChatMessage } from '../../../types';

// Hook for getting conversations
export const useConversations = () => {
  return useQuery({
    queryKey: queryKeys.chat.conversations,
    queryFn: () => chatApi.getRecentConversations(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for getting a specific conversation
export const useConversation = (userId: number, pageable: Pageable) => {
  return useQuery({
    queryKey: queryKeys.chat.conversation(userId, pageable),
    queryFn: () => chatApi.getConversation(userId, pageable),
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

// Hook for sending messages
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: newMessage => {
      // Update conversation cache
      const conversationKey = queryKeys.chat.conversation(
        newMessage.recipientId,
        { page: 0, size: 20 }
      );

      queryClient.setQueryData(conversationKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: [newMessage, ...old.content],
        };
      });

      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
    },
  });
};

// Hook for marking conversation as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.markConversationAsRead,
    onSuccess: (_, userId) => {
      // Update conversation cache to mark messages as read
      queryClient.setQueriesData(
        { queryKey: queryKeys.chat.conversation(userId) },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((message: ChatMessage) => ({
              ...message,
              read: true,
            })),
          };
        }
      );

      // Update conversations list to reset unread count
      queryClient.setQueryData(queryKeys.chat.conversations, (old: any) => {
        if (!old) return old;
        return old.map((conversation: any) =>
          conversation.userId === userId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        );
      });

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
    },
  });
};

// Hook for getting unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: queryKeys.chat.unreadCount,
    queryFn: () => chatApi.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for searching messages
export const useSearchMessages = (query: string, pageable: Pageable) => {
  return useQuery({
    queryKey: queryKeys.chat.search(query, pageable),
    queryFn: () => chatApi.searchMessages(query, pageable),
    enabled: !!query.trim(),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook for getting online users
export const useOnlineUsers = () => {
  return useQuery({
    queryKey: queryKeys.chat.onlineUsers,
    queryFn: () => chatApi.getOnlineUsers(),
    staleTime: 30 * 1000, // 30 seconds
  });
};
