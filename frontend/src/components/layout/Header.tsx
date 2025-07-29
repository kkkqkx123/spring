import React, { useState } from 'react';
import {
  Group,
  Burger,
  TextInput,
  Menu,
  Avatar,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSearch,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
} from '@tabler/icons-react';
import { User } from '../../types';
import { NotificationDropdown } from '../../features/notifications';

export interface HeaderProps {
  user: User;
  navbarOpened: boolean;
  toggleNavbar: () => void;
  isMobile: boolean;
}

export function Header({
  user,
  navbarOpened,
  toggleNavbar,
  isMobile,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Search:', searchValue);
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

  const handleViewAllNotifications = () => {
    console.log('View all notifications clicked');
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
        <NotificationDropdown onViewAll={handleViewAllNotifications} />

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
