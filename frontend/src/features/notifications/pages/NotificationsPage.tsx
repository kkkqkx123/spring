import React, { useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Tabs,
  Badge,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { notifications as notificationManager } from '@mantine/notifications';
import {
  IconBell,
  IconBellOff,
  IconCheck,
  IconTrash,
  IconDots,
  IconSettings,
  IconAlertCircle,
} from '@tabler/icons-react';
import { NotificationList } from '../components/NotificationList';
import { NotificationSettings } from '../components/NotificationSettings';
import { useNotifications } from '../hooks/useNotifications';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import type { Notification } from '../../../types';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('all');

  const {
    notifications,
    isLoading,
    markAllAsRead,
    clearNotifications,
    unreadCount,
  } = useNotifications();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      notificationManager.show({
        title: 'Success',
        message: 'All notifications marked as read',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notificationManager.show({
        title: 'Error',
        message: 'Failed to mark notifications as read',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      notificationManager.show({
        title: 'Success',
        message: 'All notifications cleared',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notificationManager.show({
        title: 'Error',
        message: 'Failed to clear notifications',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const getFilteredNotifications = () => {
    if (!notifications) return [];

    switch (activeTab) {
      case 'unread':
        return notifications.filter((n: Notification) => !n.read);
      case 'read':
        return notifications.filter((n: Notification) => n.read);
      case 'all':
      default:
        return notifications;
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Group align="center" gap="sm">
              <Text size="xl" fw={700}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Badge color="red" variant="filled" size="sm">
                  {unreadCount} unread
                </Badge>
              )}
            </Group>
            <Text c="dimmed">Stay updated with the latest activities</Text>
          </div>

          <Group gap="sm">
            {unreadCount > 0 && (
              <Button
                leftSection={<IconCheck size={16} />}
                variant="light"
                onClick={handleMarkAllAsRead}
                loading={isLoading}
              >
                Mark All Read
              </Button>
            )}

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="light" size="lg">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={handleClearAll}
                  disabled={isLoading}
                >
                  Clear All
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Tabs */}
        <Card padding="lg" radius="md" withBorder>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="all" leftSection={<IconBell size={16} />}>
                All ({notifications?.length || 0})
              </Tabs.Tab>
              <Tabs.Tab
                value="unread"
                leftSection={<IconBell size={16} />}
                rightSection={
                  unreadCount > 0 ? (
                    <Badge color="red" variant="filled" size="xs">
                      {unreadCount}
                    </Badge>
                  ) : null
                }
              >
                Unread
              </Tabs.Tab>
              <Tabs.Tab value="read" leftSection={<IconBellOff size={16} />}>
                Read ({(notifications?.length || 0) - unreadCount})
              </Tabs.Tab>
              <Tabs.Tab
                value="settings"
                leftSection={<IconSettings size={16} />}
              >
                Settings
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="all" pt="lg">
              <NotificationList />
            </Tabs.Panel>

            <Tabs.Panel value="unread" pt="lg">
              <NotificationList />
            </Tabs.Panel>

            <Tabs.Panel value="read" pt="lg">
              <NotificationList />
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="lg">
              <NotificationSettings />
            </Tabs.Panel>
          </Tabs>
        </Card>

        {/* Empty State */}
        {filteredNotifications.length === 0 && activeTab !== 'settings' && (
          <Card padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md">
              <IconBellOff size={48} color="gray" />
              <Text size="lg" fw={500} c="dimmed">
                No notifications
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {activeTab === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : activeTab === 'read'
                    ? 'No read notifications to display.'
                    : "You don't have any notifications yet."}
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default NotificationsPage;
