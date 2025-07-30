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
  isTablet?: boolean;
}

export function Header({
  user,
  navbarOpened,
  toggleNavbar,
  isMobile,
  isTablet = false,
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

  const getHeaderPadding = () => {
    if (isMobile) return 'sm';
    return 'md';
  };

  const getSearchMaxWidth = () => {
    if (isMobile) return 200;
    if (isTablet) return 300;
    return 400;
  };

  const showFullUserInfo = !isMobile && !isTablet;

  return (
    <Group
      h="100%"
      px={getHeaderPadding()}
      justify="space-between"
      wrap="nowrap"
    >
      {/* Left Section */}
      <Group gap="sm" style={{ minWidth: 0 }}>
        {isMobile && (
          <Burger
            opened={navbarOpened}
            onClick={toggleNavbar}
            size="sm"
            aria-label="Toggle navigation"
            style={{
              // Touch-friendly size
              minWidth: '44px',
              minHeight: '44px',
            }}
          />
        )}

        <Text
          size={isMobile ? 'md' : 'lg'}
          fw={700}
          c="blue"
          truncate
          style={{
            maxWidth: isMobile ? '120px' : 'none',
          }}
        >
          {isMobile ? 'EMS' : 'Employee Management'}
        </Text>
      </Group>

      {/* Center Section - Search (hidden on mobile) */}
      {!isMobile && (
        <Group style={{ flex: 1, maxWidth: getSearchMaxWidth() }}>
          <form onSubmit={handleSearch} style={{ width: '100%' }}>
            <TextInput
              placeholder={
                isTablet ? 'Search...' : 'Search employees, departments...'
              }
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={event => setSearchValue(event.currentTarget.value)}
              style={{ width: '100%' }}
              size="sm"
            />
          </form>
        </Group>
      )}

      {/* Right Section */}
      <Group gap={isMobile ? 'xs' : 'sm'} wrap="nowrap">
        {/* Notifications */}
        <NotificationDropdown onViewAll={handleViewAllNotifications} />

        {/* User Menu */}
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton
              style={{
                // Touch-friendly size on mobile
                minWidth: isMobile ? '44px' : 'auto',
                minHeight: isMobile ? '44px' : 'auto',
                borderRadius: 'var(--mantine-radius-sm)',
                padding: isMobile ? '0.25rem' : '0.5rem',
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <Avatar size={isMobile ? 'md' : 'sm'} color="blue">
                  {user.firstName?.[0] || user.username[0]}
                </Avatar>
                {showFullUserInfo && (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
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
            {/* Show user info in dropdown on mobile/tablet */}
            {!showFullUserInfo && (
              <>
                <Menu.Label>
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </Menu.Label>
                <Text size="xs" c="dimmed" px="sm" pb="xs">
                  {user.email}
                </Text>
                <Menu.Divider />
              </>
            )}

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

            {/* Mobile search option */}
            {isMobile && (
              <Menu.Item
                leftSection={<IconSearch size={16} />}
                onClick={() => {
                  // This would open a search modal on mobile
                  console.log('Open search modal');
                }}
              >
                Search
              </Menu.Item>
            )}

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
