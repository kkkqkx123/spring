import React, { useState } from 'react';
import { Box, Grid, Paper, Group, Text, Stack, Center, ActionIcon, Drawer } from '@mantine/core';
import { IconWifiOff, IconArrowLeft, IconUsers } from '@tabler/icons-react';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ConversationList } from './ConversationList';
import { MessageHistory } from './MessageHistory';
import { MessageInput } from './MessageInput';
import { OnlineStatus } from './OnlineStatus';
import { useRealTimeChat } from '../hooks/useRealTimeChat';
import { useIsMobile, useIsTablet } from '../../../utils/responsive';

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
  const [conversationDrawerOpened, { open: openConversationDrawer, close: closeConversationDrawer }] = useDisclosure(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { onlineUsers, connectionState } = useRealTimeChat();

  const isOnline = selectedUserId ? onlineUsers.has(selectedUserId) : false;

  // Handle conversation selection
  const handleSelectConversation = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    // Close drawer on mobile after selection
    if (isMobile) {
      closeConversationDrawer();
    }
  };

  // Handle back to conversations on mobile
  const handleBackToConversations = () => {
    if (isMobile) {
      setSelectedUserId(undefined);
      setSelectedUserName('');
    }
  };

  // Mobile layout: show either conversations or chat, not both
  if (isMobile) {
    return (
      <Paper shadow="sm" radius="md" h={height}>
        {!selectedUserId ? (
          // Show conversation list on mobile when no chat selected
          <ConversationList
            selectedUserId={selectedUserId}
            onSelectConversation={handleSelectConversation}
            height={height}
            isMobile={isMobile}
          />
        ) : (
          // Show chat interface on mobile when conversation selected
          <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Mobile chat header with back button */}
            <Box
              p="sm"
              style={{
                borderBottom: '1px solid var(--mantine-color-gray-3)',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <ActionIcon
                    variant="subtle"
                    onClick={handleBackToConversations}
                    size="lg"
                    aria-label="Back to conversations"
                  >
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                  <OnlineStatus
                    isOnline={isOnline}
                    userName={selectedUserName}
                    size="sm"
                  />
                  <Box>
                    <Text fw={500} size="sm" lineClamp={1}>
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
                isMobile={isMobile}
              />
            </Box>

            {/* Message input area */}
            <Box
              p="sm"
              style={{
                borderTop: '1px solid var(--mantine-color-gray-3)',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <MessageInput
                recipientId={selectedUserId}
                recipientName={selectedUserName}
                disabled={connectionState !== 'connected'}
                isMobile={isMobile}
              />
            </Box>
          </Box>
        )}
      </Paper>
    );
  }

  // Tablet and desktop layout
  return (
    <Paper shadow="sm" radius="md" h={height}>
      <Grid h="100%" gutter={0}>
        {/* Conversations sidebar */}
        <Grid.Col
          span={isTablet ? 5 : 4}
          style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}
        >
          <ConversationList
            selectedUserId={selectedUserId}
            onSelectConversation={handleSelectConversation}
            height={height}
            isTablet={isTablet}
          />
        </Grid.Col>

        {/* Chat area */}
        <Grid.Col span={isTablet ? 7 : 8}>
          {selectedUserId ? (
            <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Chat header */}
              <Box
                p={isTablet ? 'sm' : 'md'}
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
                      <Text fw={500} size={isTablet ? 'sm' : 'md'} lineClamp={1}>
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
                  isTablet={isTablet}
                />
              </Box>

              {/* Message input area */}
              <Box
                p={isTablet ? 'sm' : 'md'}
                style={{
                  borderTop: '1px solid var(--mantine-color-gray-3)',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                }}
              >
                <MessageInput
                  recipientId={selectedUserId}
                  recipientName={selectedUserName}
                  disabled={connectionState !== 'connected'}
                  isTablet={isTablet}
                />
              </Box>
            </Box>
          ) : (
            <Center h="100%">
              <Stack align="center" gap="sm">
                <Text c="dimmed" size={isTablet ? 'md' : 'lg'}>
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
