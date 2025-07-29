import React from 'react';
import { Box, Text, Group, Avatar, Tooltip } from '@mantine/core';
import { IconCheck, IconChecks } from '@tabler/icons-react';
import { formatDate } from '../../../utils';
import { useAuth } from '../../../hooks/useAuth';
import type { ChatMessage } from '../../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
  isConsecutive?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  isConsecutive = false,
}) => {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.senderId;

  return (
    <Group
      gap="sm"
      align="flex-start"
      justify={isOwnMessage ? 'flex-end' : 'flex-start'}
      mb={isConsecutive ? 4 : 12}
      wrap="nowrap"
    >
      {/* Avatar for received messages */}
      {!isOwnMessage && showAvatar && (
        <Avatar
          size="sm"
          radius="xl"
          color="blue"
          style={{ 
            visibility: isConsecutive ? 'hidden' : 'visible',
            minWidth: 32,
          }}
        >
          {message.senderName.charAt(0).toUpperCase()}
        </Avatar>
      )}

      {/* Message content */}
      <Box
        style={{
          maxWidth: '70%',
          minWidth: 100,
        }}
      >
        {/* Sender name for received messages */}
        {!isOwnMessage && !isConsecutive && (
          <Text size="xs" c="dimmed" mb={4}>
            {message.senderName}
          </Text>
        )}

        {/* Message bubble */}
        <Box
          p="xs"
          style={(theme) => ({
            backgroundColor: isOwnMessage 
              ? theme.colors.blue[6] 
              : theme.colors.gray[1],
            color: isOwnMessage 
              ? theme.white 
              : theme.colors.dark[7],
            borderRadius: theme.radius.md,
            borderTopLeftRadius: !isOwnMessage && isConsecutive ? 4 : theme.radius.md,
            borderTopRightRadius: isOwnMessage && isConsecutive ? 4 : theme.radius.md,
            wordBreak: 'break-word',
            position: 'relative',
          })}
        >
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Text>
        </Box>

        {/* Message metadata */}
        <Group
          gap={4}
          justify={isOwnMessage ? 'flex-end' : 'flex-start'}
          mt={4}
        >
          <Tooltip label={formatDate(message.createdAt, 'long')}>
            <Text size="xs" c="dimmed">
              {formatDate(message.createdAt)}
            </Text>
          </Tooltip>

          {/* Read status for own messages */}
          {isOwnMessage && (
            <Box c={message.read ? 'blue' : 'dimmed'}>
              {message.read ? (
                <IconChecks size={12} />
              ) : (
                <IconCheck size={12} />
              )}
            </Box>
          )}
        </Group>
      </Box>

      {/* Spacer for sent messages to maintain alignment */}
      {isOwnMessage && showAvatar && (
        <Box style={{ minWidth: 32 }} />
      )}
    </Group>
  );
};

export default MessageBubble;