import React, { useState } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  TextInput,
  ScrollArea,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useConversations } from '../hooks/useChat';
import { useRealTimeChat } from '../hooks/useRealTimeChat';
import { OnlineStatus } from './OnlineStatus';
import { formatDate } from '../../../utils';
import type { Conversation } from '../../../types';

interface ConversationListProps {
  selectedUserId?: number;
  onSelectConversation: (userId: number, userName: string) => void;
  height?: number;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedUserId,
  onSelectConversation,
  height = 400,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations, isLoading, error } = useConversations();
  const { onlineUsers } = useRealTimeChat();

  // Filter conversations based on search query
  const filteredConversations = conversations?.filter(conversation =>
    conversation.userName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleConversationClick = (conversation: Conversation) => {
    onSelectConversation(conversation.userId, conversation.userName);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <Center h={height}>
        <Loader size="md" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={height}>
        <Text c="red" size="sm">
          Failed to load conversations
        </Text>
      </Center>
    );
  }

  return (
    <Box h={height}>
      {/* Search bar */}
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <TextInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
        />
      </Box>

      {/* Conversations list */}
      <ScrollArea h={height - 80}>
        {filteredConversations.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed" size="sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
          </Center>
        ) : (
          <Stack gap={0}>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.userId}
                conversation={conversation}
                isSelected={selectedUserId === conversation.userId}
                isOnline={onlineUsers.has(conversation.userId)}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Box>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  isOnline: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  isOnline,
  onClick,
}) => {
  const { lastMessage, unreadCount } = conversation;

  return (
    <Paper
      p="md"
      style={(theme) => ({
        cursor: 'pointer',
        backgroundColor: isSelected 
          ? theme.colors.blue[0] 
          : 'transparent',
        borderRadius: 0,
        borderLeft: isSelected 
          ? `3px solid ${theme.colors.blue[6]}` 
          : '3px solid transparent',
        '&:hover': {
          backgroundColor: isSelected 
            ? theme.colors.blue[0] 
            : theme.colors.gray[0],
        },
      })}
      onClick={onClick}
    >
      <Group gap="md" wrap="nowrap">
        {/* Avatar with online status */}
        <OnlineStatus
          isOnline={isOnline}
          userName={conversation.userName}
          size="md"
          showTooltip={false}
        />

        {/* Conversation details */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" mb={4}>
            <Text
              fw={unreadCount > 0 ? 600 : 400}
              size="sm"
              truncate
              style={{ flex: 1 }}
            >
              {conversation.userName}
            </Text>

            {/* Timestamp and unread badge */}
            <Group gap={4} align="center">
              {lastMessage && (
                <Text size="xs" c="dimmed">
                  {formatDate(lastMessage.createdAt)}
                </Text>
              )}
              {unreadCount > 0 && (
                <Badge
                  size="xs"
                  variant="filled"
                  color="blue"
                  style={{ minWidth: 18, height: 18 }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Group>
          </Group>

          {/* Last message preview */}
          {lastMessage && (
            <Text
              size="xs"
              c="dimmed"
              truncate
              fw={unreadCount > 0 ? 500 : 400}
            >
              {lastMessage.content}
            </Text>
          )}
        </Box>
      </Group>
    </Paper>
  );
};

export default ConversationList;