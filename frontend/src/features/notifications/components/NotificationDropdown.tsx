import React from 'react';
import {
  Menu,
  ActionIcon,
  Indicator,
  Group,
  Text,
  Badge,
  Divider,
  ScrollArea,
  Stack,
  Button,
} from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useNotificationStore } from '../../../stores/notificationStore';
import { NotificationItem } from './NotificationItem';

export interface NotificationDropdownProps {
  onViewAll?: () => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationDropdown({
  onViewAll,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    onMarkAllAsRead?.();
  };

  const handleViewAll = () => {
    onViewAll?.();
  };

  // Show only recent notifications (last 10)
  const recentNotifications = notifications.slice(0, 10);

  return (
    <Menu shadow="md" width={360} position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          size="lg"
          aria-label="Notifications"
          loading={isLoading}
        >
          <Indicator
            color="red"
            size={16}
            disabled={unreadCount === 0}
            label={unreadCount > 99 ? '99+' : unreadCount}
          >
            <IconBell size={20} />
          </Indicator>
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between">
            <Text fw={600}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge size="sm" variant="filled" color="red">
                {unreadCount} new
              </Badge>
            )}
          </Group>
        </Menu.Label>

        {unreadCount > 0 && (
          <>
            <Divider />
            <Group p="xs" justify="flex-end">
              <Button
                variant="subtle"
                size="xs"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            </Group>
          </>
        )}

        <Divider />

        <ScrollArea.Autosize mah={400}>
          <Stack gap={0}>
            {recentNotifications.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No notifications
              </Text>
            ) : (
              recentNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification.id)}
                />
              ))
            )}
          </Stack>
        </ScrollArea.Autosize>

        {notifications.length > 0 && (
          <>
            <Divider />
            <Menu.Item onClick={handleViewAll}>
              <Text size="sm" ta="center" c="blue" fw={500}>
                View all notifications
              </Text>
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}