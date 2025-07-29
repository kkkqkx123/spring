import React from 'react';
import { Indicator, ActionIcon } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useNotificationStore } from '../../../stores/notificationStore';

export interface NotificationBadgeProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'filled' | 'outline';
  loading?: boolean;
}

export function NotificationBadge({
  onClick,
  size = 'lg',
  variant = 'subtle',
  loading = false,
}: NotificationBadgeProps) {
  const { unreadCount } = useNotificationStore();

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 20;

  return (
    <ActionIcon
      variant={variant}
      size={size}
      onClick={onClick}
      loading={loading}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      data-testid="notification-badge"
    >
      <Indicator
        color="red"
        size={16}
        disabled={unreadCount === 0}
        label={unreadCount > 99 ? '99+' : unreadCount}
        data-testid="notification-indicator"
      >
        <IconBell size={iconSize} />
      </Indicator>
    </ActionIcon>
  );
}
