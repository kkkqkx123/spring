import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  ScrollArea,
  Stack,
  Center,
  Loader,
  Text,
  Button,
  Alert,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconChevronUp } from '@tabler/icons-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useConversation } from '../hooks/useChat';
import { useRealTimeChat } from '../hooks/useRealTimeChat';
import type { ChatMessage, Pageable } from '../../../types';

interface MessageHistoryProps {
  userId: number;
  userName: string;
  height?: number;
  autoScroll?: boolean;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({
  userId,
  userName,
  height = 400,
  autoScroll = true,
}) => {
  const [pageable, setPageable] = useState<Pageable>({ page: 0, size: 20 });
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { typingUsers } = useRealTimeChat();

  const {
    data: conversationData,
    isLoading,
    error,
    refetch,
  } = useConversation(userId, pageable);

  const typingUser = typingUsers.get(userId);
  const canLoadMore = conversationData && !conversationData.last;

  // Update messages when new data arrives
  useEffect(() => {
    if (conversationData?.content) {
      if (pageable.page === 0) {
        // First page - replace all messages
        setAllMessages(conversationData.content);
        setHasLoadedInitial(true);
      } else {
        // Additional pages - append to existing messages
        setAllMessages(prev => [...conversationData.content, ...prev]);
      }
    }
  }, [conversationData, pageable.page]);

  // Reset when user changes
  useEffect(() => {
    setAllMessages([]);
    setPageable({ page: 0, size: 20 });
    setHasLoadedInitial(false);
  }, [userId]);

  // Auto-scroll to bottom for new messages (only on first page)
  useEffect(() => {
    if (autoScroll && hasLoadedInitial && pageable.page === 0) {
      scrollToBottom();
    }
  }, [
    allMessages.length,
    typingUser,
    autoScroll,
    hasLoadedInitial,
    pageable.page,
  ]);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  const loadMoreMessages = () => {
    if (canLoadMore && !isLoading) {
      setPageable(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleRetry = () => {
    refetch();
  };

  // Group consecutive messages from the same sender
  const groupedMessages = allMessages.reduce(
    (groups: ChatMessage[][], message, index) => {
      const prevMessage = allMessages[index - 1];
      const isConsecutive =
        prevMessage &&
        prevMessage.senderId === message.senderId &&
        new Date(message.createdAt).getTime() -
          new Date(prevMessage.createdAt).getTime() <
          60000; // 1 minute

      if (isConsecutive) {
        groups[groups.length - 1].push(message);
      } else {
        groups.push([message]);
      }
      return groups;
    },
    []
  );

  if (error && !hasLoadedInitial) {
    return (
      <Center h={height} p="md">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading messages"
          color="red"
          variant="light"
        >
          <Text size="sm" mb="md">
            Failed to load conversation. Please try again.
          </Text>
          <Button size="xs" onClick={handleRetry}>
            Retry
          </Button>
        </Alert>
      </Center>
    );
  }

  if (isLoading && !hasLoadedInitial) {
    return (
      <Center h={height}>
        <Loader size="md" />
      </Center>
    );
  }

  if (allMessages.length === 0 && hasLoadedInitial) {
    return (
      <Center h={height} p="md">
        <Stack align="center" gap="sm">
          <Text c="dimmed" size="sm">
            No messages yet
          </Text>
          <Text c="dimmed" size="xs" ta="center">
            Start a conversation with {userName}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box h={height} style={{ position: 'relative' }}>
      <ScrollArea
        h="100%"
        ref={scrollAreaRef}
        scrollbarSize={6}
        style={{ padding: '0 16px' }}
      >
        <Stack gap="xs" py="md">
          {/* Load more button */}
          {canLoadMore && (
            <Center mb="md">
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconChevronUp size={14} />}
                onClick={loadMoreMessages}
                loading={isLoading && pageable.page > 0}
                disabled={isLoading}
              >
                Load older messages
              </Button>
            </Center>
          )}

          {/* Error loading more messages */}
          {error && hasLoadedInitial && (
            <Center mb="md">
              <Alert
                icon={<IconAlertCircle size={14} />}
                color="red"
                variant="light"
                size="sm"
              >
                <Group gap="xs">
                  <Text size="xs">Failed to load messages</Text>
                  <Button size="xs" variant="subtle" onClick={handleRetry}>
                    Retry
                  </Button>
                </Group>
              </Alert>
            </Center>
          )}

          {/* Messages */}
          {groupedMessages.map((messageGroup, groupIndex) => (
            <Box key={`group-${groupIndex}`}>
              {messageGroup.map((message, messageIndex) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={messageIndex === 0}
                  isConsecutive={messageIndex > 0}
                />
              ))}
            </Box>
          ))}

          {/* Typing indicator */}
          {typingUser && (
            <TypingIndicator userName={typingUser} isVisible={true} />
          )}

          {/* Loading indicator for pagination */}
          {isLoading && pageable.page > 0 && (
            <Center py="md">
              <Group gap="xs">
                <Loader size="sm" />
                <Text size="xs" c="dimmed">
                  Loading messages...
                </Text>
              </Group>
            </Center>
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
};

export default MessageHistory;
