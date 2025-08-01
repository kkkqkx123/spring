import React, { useState } from 'react';
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  Select,
  TextInput,
  Card,
  Pagination,
  Center,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconTrash,
  IconCheck,
  IconDots,
} from '@tabler/icons-react';
import type { Notification, NotificationType } from '@/types';
import { NotificationItem } from './NotificationItem';
import { useNotificationStore } from '@/stores/notificationStore';

export interface NotificationListProps {
  onNotificationClick?: (notification: Notification) => void;
  onDeleteNotification?: (id: number) => void;
  onMarkAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

export function NotificationList({
  onNotificationClick,
  onDeleteNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'all' || notification.type === typeFilter;

    const matchesRead =
      readFilter === 'all' ||
      (readFilter === 'read' && notification.read) ||
      (readFilter === 'unread' && !notification.read);

    return matchesSearch && matchesType && matchesRead;
  });

  // Paginate notifications
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
    onMarkAsRead?.(id);
  };

  const handleDeleteNotification = (id: number) => {
    removeNotification(id);
    onDeleteNotification?.(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    onMarkAllAsRead?.();
  };

  const handleClearAll = () => {
    clearNotifications();
    onClearAll?.();
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'info', label: 'Information' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
  ];

  const readOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2}>Notifications</Title>
          <Text size="sm" c="dimmed">
            {filteredNotifications.length} notifications
            {unreadCount > 0 && ` (${unreadCount} unread)`}
          </Text>
        </div>

        <Group>
          {unreadCount > 0 && (
            <Button
              variant="light"
              leftSection={<IconCheck size={16} />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                Clear all notifications
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Filters */}
      <Card withBorder p="md">
        <Group>
          <TextInput
            placeholder="Search notifications..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={event => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />

          <Select
            placeholder="Type"
            leftSection={<IconFilter size={16} />}
            value={typeFilter}
            onChange={value => setTypeFilter(value as NotificationType | 'all')}
            data={typeOptions}
            w={150}
          />

          <Select
            placeholder="Status"
            value={readFilter}
            onChange={value =>
              setReadFilter(value as 'all' | 'read' | 'unread')
            }
            data={readOptions}
            w={120}
          />
        </Group>
      </Card>

      {/* Notifications List */}
      <Card withBorder>
        {paginatedNotifications.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text size="lg" c="dimmed">
                No notifications found
              </Text>
              <Text size="sm" c="dimmed">
                {searchQuery || typeFilter !== 'all' || readFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'You have no notifications yet'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap={0}>
            {paginatedNotifications.map((notification, index) => (
              <div key={notification.id}>
                <Group gap="sm" p="sm">
                  <div style={{ flex: 1 }}>
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  </div>

                  <Group gap="xs">
                    {!notification.read && (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <IconCheck size={14} />
                      </ActionIcon>
                    )}

                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      color="red"
                      onClick={() => handleDeleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                {index < paginatedNotifications.length - 1 && (
                  <div
                    style={{
                      borderBottom: '1px solid var(--mantine-color-gray-2)',
                    }}
                  />
                )}
              </div>
            ))}
          </Stack>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Center>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="sm"
          />
        </Center>
      )}
    </Stack>
  );
}
