import React, { useState } from 'react';
import { Box, Grid, Paper, Group, Text, Stack, Center } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { ConversationList } from './ConversationList';
import { MessageHistory } from './MessageHistory';
import { MessageInput } from './MessageInput';
import { OnlineStatus } from './OnlineStatus';
import { useRealTimeChat } from '../hooks/useRealTimeChat';

interface ChatInterfaceProps {
  height?: number;
  defaultSelectedUserId?: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  height = 600,
  defaultSelectedUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    defaultSelectedUserId
  );
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  const { onlineUsers, connectionState } = useRealTimeChat();

  const isOnline = selectedUserId ? onlineUsers.has(selectedUserId) : false;

  // Handle conversation selection
  const handleSelectConversation = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  return (
    <Paper shadow="sm" radius="md" h={height}>
      <Grid h="100%" gutter={0}>
        {/* Conversations sidebar */}
        <Grid.Col
          span={4}
          style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}
        >
          <ConversationList
            selectedUserId={selectedUserId}
            onSelectConversation={handleSelectConversation}
            height={height}
          />
        </Grid.Col>

        {/* Chat area */}
        <Grid.Col span={8}>
          {selectedUserId ? (
            <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Chat header */}
              <Box
                p="md"
                style={{
                  borderBottom: '1px solid var(--mantine-color-gray-3)',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                }}
              >
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <OnlineStatus
                      isOnline={isOnline}
                      userName={selectedUserName}
                      size="sm"
                    />
                    <Box>
                      <Text fw={500} size="sm">
                        {selectedUserName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </Box>
                  </Group>

                  {/* Connection status */}
                  {connectionState !== 'connected' && (
                    <Group gap="xs">
                      <IconWifiOff
                        size={16}
                        color="var(--mantine-color-red-6)"
                      />
                      <Text size="xs" c="red">
                        {connectionState === 'connecting'
                          ? 'Connecting...'
                          : 'Disconnected'}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Box>

              {/* Messages area */}
              <Box style={{ flex: 1, position: 'relative' }}>
                <MessageHistory
                  userId={selectedUserId}
                  userName={selectedUserName}
                  height={height - 120} // Account for header and input
                />
              </Box>

              {/* Message input area */}
              <Box
                p="md"
                style={{
                  borderTop: '1px solid var(--mantine-color-gray-3)',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                }}
              >
                <MessageInput
                  recipientId={selectedUserId}
                  recipientName={selectedUserName}
                  disabled={connectionState !== 'connected'}
                />
              </Box>
            </Box>
          ) : (
            <Center h="100%">
              <Stack align="center" gap="sm">
                <Text c="dimmed" size="lg">
                  Select a conversation
                </Text>
                <Text c="dimmed" size="sm" ta="center">
                  Choose a conversation from the list to start chatting
                </Text>
              </Stack>
            </Center>
          )}
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default ChatInterface;
