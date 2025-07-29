import React, { useState, useEffect } from 'react';
import {
  Box,
  TextInput,
  ScrollArea,
  Group,
  Text,
  ActionIcon,
  Highlight,
  Paper,
  Center,
  Loader,
  Stack,
  Badge,
} from '@mantine/core';
import { IconSearch, IconX, IconMessage } from '@tabler/icons-react';
import { useSearchMessages } from '../hooks/useChat';
import { formatDate, debounce } from '../../../utils';
import type { ChatMessage } from '../../../types';

interface MessageSearchProps {
  onMessageSelect?: (message: ChatMessage) => void;
  height?: number;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  onMessageSelect,
  height = 400,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageable] = useState({ page: 0, size: 50 });

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const debouncedSetQuery = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300);

    debouncedSetQuery(searchQuery);

    return () => {
      // Cleanup debounced function
    };
  }, [searchQuery]);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearchMessages(debouncedQuery, pageable);

  const messages = searchResults?.content || [];

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleMessageClick = (message: ChatMessage) => {
    if (onMessageSelect) {
      onMessageSelect(message);
    }
  };

  return (
    <Box h={height}>
      {/* Search input */}
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <TextInput
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
        />
      </Box>

      {/* Search results */}
      <ScrollArea h={height - 80}>
        {!debouncedQuery ? (
          <Center p="xl">
            <Stack align="center" gap="sm">
              <IconMessage size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" size="sm">
                Enter a search term to find messages
              </Text>
            </Stack>
          </Center>
        ) : isLoading ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : error ? (
          <Center p="xl">
            <Text c="red" size="sm">
              Failed to search messages
            </Text>
          </Center>
        ) : messages.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="sm">
              <Text c="dimmed" size="sm">
                No messages found for "{debouncedQuery}"
              </Text>
              <Text c="dimmed" size="xs">
                Try different keywords or check spelling
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap={0}>
            {/* Results count */}
            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Text size="sm" c="dimmed">
                Found {searchResults?.totalElements || 0} messages
              </Text>
            </Box>

            {/* Message results */}
            {messages.map((message) => (
              <MessageSearchResult
                key={message.id}
                message={message}
                searchQuery={debouncedQuery}
                onClick={() => handleMessageClick(message)}
              />
            ))}

            {/* Load more indicator */}
            {searchResults && !searchResults.last && (
              <Center p="md">
                <Text size="xs" c="dimmed">
                  Showing {messages.length} of {searchResults.totalElements} results
                </Text>
              </Center>
            )}
          </Stack>
        )}
      </ScrollArea>
    </Box>
  );
};

interface MessageSearchResultProps {
  message: ChatMessage;
  searchQuery: string;
  onClick: () => void;
}

const MessageSearchResult: React.FC<MessageSearchResultProps> = ({
  message,
  searchQuery,
  onClick,
}) => {
  return (
    <Paper
      p="md"
      style={{
        cursor: 'pointer',
        borderRadius: 0,
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        '&:hover': {
          backgroundColor: 'var(--mantine-color-gray-0)',
        },
      }}
      onClick={onClick}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
          <Text fw={500} size="sm">
            {message.senderName}
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {message.senderId === message.recipientId ? 'Self' : 'Chat'}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {formatDate(message.createdAt, 'long')}
        </Text>
      </Group>

      <Box>
        <Highlight
          highlight={searchQuery}
          size="sm"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          highlightStyles={{
            backgroundColor: 'var(--mantine-color-yellow-2)',
            fontWeight: 600,
          }}
        >
          {message.content}
        </Highlight>
      </Box>

      <Group justify="space-between" align="center" mt="xs">
        <Text size="xs" c="dimmed">
          To: {message.recipientName}
        </Text>
        {message.read && (
          <Badge size="xs" variant="light" color="green">
            Read
          </Badge>
        )}
      </Group>
    </Paper>
  );
};

export default MessageSearch;