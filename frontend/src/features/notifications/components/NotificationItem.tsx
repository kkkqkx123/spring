import React from 'react';
import {
  UnstyledButton,
  Group,
  Text,
  Badge,
  Box,
  ThemeIcon,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle,
  IconX,
} from '@tabler/icons-react';
import { Notification, NotificationType } from '../../../types';
import { formatDistanceToNow } from 'date-fns';

export interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return IconCheck;
    case 'warning':
      return IconAlertTriangle;
    case 'error':
      return IconX;
    default:
      return IconInfoCircle;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    default:
      return 'blue';
  }
};

export function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <UnstyledButton
      onClick={onClick}
      p={compact ? 'xs' : 'sm'}
      style={{
        width: '100%',
        borderRadius: 'var(--mantine-radius-sm)',
        backgroundColor: notification.read
          ? 'transparent'
          : 'var(--mantine-color-blue-0)',
        borderLeft: notification.read
          ? 'none'
          : `3px solid var(--mantine-color-${color}-5)`,
        transition: 'background-color 0.2s ease',
      }}
      data-testid={`notification-item-${notification.id}`}
    >
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <ThemeIcon
          size={compact ? 'sm' : 'md'}
          color={color}
          variant="light"
          radius="xl"
        >
          <Icon size={compact ? 14 : 16} />
        </ThemeIcon>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={2}>
            <Text
              size={compact ? 'xs' : 'sm'}
              fw={notification.read ? 400 : 600}
              lineClamp={1}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <Badge size="xs" color={color} variant="dot" />
            )}
          </Group>

          <Text
            size={compact ? 'xs' : 'sm'}
            c="dimmed"
            lineClamp={compact ? 1 : 2}
            mb={4}
          >
            {notification.message}
          </Text>

          <Text size="xs" c="dimmed">
            {timeAgo}
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
}
