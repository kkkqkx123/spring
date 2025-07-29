import React, { useState } from 'react';
import {
  Group,
  Burger,
  TextInput,
  ActionIcon,
  Menu,
  Avatar,
  Text,
  Badge,
  Indicator,
  UnstyledButton,
  Divider,
  Stack,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconBell,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
} from '@tabler/icons-react';
import { User, Notification } from '../../types';

export interface HeaderProps {
  user: User;
  navbarOpened: boolean;
  toggleNavbar: () => void;
  isMobile: boolean;
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'New Employee Added',
    message: 'John Doe has been added to the system',
    type: 'info',
    userId: 1,
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Department Updated',
    message: 'Engineering department structure has been updated',
    type: 'success',
    userId: 1,
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight at 2 AM',
    type: 'warning',
    userId: 1,
    read: true,
    createdAt: new Date().toISOString(),
  },
];

export function Header({
  user,
  navbarOpened,
  toggleNavbar,
  isMobile,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [notifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Search:', searchValue);
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  const getNotificationColor = (type: Notification['type']) => {
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

  return (
    <Group h="100%" px="md" justify="space-between">
      {/* Left Section */}
      <Group>
        {isMobile && (
          <Burger
            opened={navbarOpened}
            onClick={toggleNavbar}
            size="sm"
            aria-label="Toggle navigation"
          />
        )}

        <Text size="lg" fw={700} c="blue">
          Employee Management
        </Text>
      </Group>

      {/* Center Section - Search */}
      <Group style={{ flex: 1, maxWidth: 400 }}>
        <form onSubmit={handleSearch} style={{ width: '100%' }}>
          <TextInput
            placeholder="Search employees, departments..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={event => setSearchValue(event.currentTarget.value)}
            style={{ width: '100%' }}
            size="sm"
          />
        </form>
      </Group>

      {/* Right Section */}
      <Group gap="sm">
        {/* Notifications */}
        <Menu shadow="md" width={320} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" aria-label="Notifications">
              <Indicator
                color="red"
                size={16}
                disabled={unreadCount === 0}
                label={unreadCount > 9 ? '9+' : unreadCount}
              >
                <IconBell size={20} />
              </Indicator>
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Group justify="space-between">
                <Text>Notifications</Text>
                {unreadCount > 0 && (
                  <Badge size="sm" variant="filled" color="red">
                    {unreadCount} new
                  </Badge>
                )}
              </Group>
            </Menu.Label>

            <Divider />

            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs" p="xs">
                {notifications.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No notifications
                  </Text>
                ) : (
                  notifications.map(notification => (
                    <UnstyledButton
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      p="xs"
                      style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        backgroundColor: notification.read
                          ? 'transparent'
                          : 'var(--mantine-color-blue-0)',
                        border: '1px solid var(--mantine-color-gray-2)',
                        width: '100%',
                      }}
                    >
                      <Group gap="sm" align="flex-start">
                        <Badge
                          size="xs"
                          color={getNotificationColor(notification.type)}
                          variant="dot"
                        />
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={notification.read ? 400 : 600}>
                            {notification.title}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {notification.message}
                          </Text>
                          <Text size="xs" c="dimmed" mt="xs">
                            {new Date(
                              notification.createdAt
                            ).toLocaleTimeString()}
                          </Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  ))
                )}
              </Stack>
            </ScrollArea.Autosize>

            {notifications.length > 0 && (
              <>
                <Divider />
                <Menu.Item>
                  <Text size="sm" ta="center" c="blue">
                    View all notifications
                  </Text>
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>

        {/* User Menu */}
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton>
              <Group gap="sm">
                <Avatar size="sm" color="blue">
                  {user.firstName?.[0] || user.username[0]}
                </Avatar>
                {!isMobile && (
                  <>
                    <div>
                      <Text size="sm" fw={500}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </div>
                    <IconChevronDown size={14} />
                  </>
                )}
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={handleProfileClick}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={handleSettingsClick}
            >
              Settings
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              leftSection={<IconLogout size={16} />}
              color="red"
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
