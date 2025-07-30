import React from 'react';
import { NavLink, Stack, Text, Group, ThemeIcon, Divider } from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconBuilding,
  IconMessage,
  IconMail,
  IconBell,
  IconSettings,
  IconShield,
  IconLogout,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types';

export interface NavigationProps {
  user: User;
  onNavigate?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

interface NavigationItem {
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  requiredRoles?: string[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: IconDashboard,
    href: '/dashboard',
  },
  {
    label: 'Employees',
    icon: IconUsers,
    href: '/employees',
    requiredRoles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'Departments',
    icon: IconBuilding,
    href: '/departments',
    requiredRoles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'Chat',
    icon: IconMessage,
    href: '/chat',
  },
  {
    label: 'Email',
    icon: IconMail,
    href: '/email',
    requiredRoles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'Notifications',
    icon: IconBell,
    href: '/notifications',
  },
  {
    label: 'Settings',
    icon: IconSettings,
    href: '/settings',
  },
  {
    label: 'Permissions',
    icon: IconShield,
    href: '/permissions',
    requiredRoles: ['ADMIN'],
  },
];

export function Navigation({ user, onNavigate, isMobile = false, isTablet = false }: NavigationProps) {
  const location = useLocation();

  const hasRequiredRole = (requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return user.roles.some(role => requiredRoles.includes(role.name));
  };

  const isActive = (href: string): boolean => {
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    );
  };

  const handleLogout = () => {
    // This will be handled by the auth store
    console.log('Logout clicked');
    onNavigate?.();
  };

  const getIconSize = () => {
    if (isMobile) return 20;
    if (isTablet) return 18;
    return 18;
  };

  const getTextSize = () => {
    if (isMobile) return 'md';
    return 'sm';
  };

  const getSpacing = () => {
    if (isMobile) return 'sm';
    return 'xs';
  };

  return (
    <Stack gap={getSpacing()} h="100%">
      {/* User Info */}
      <Group
        gap="sm"
        p={isMobile ? 'md' : 'sm'}
        style={{ 
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          // Add touch-friendly spacing on mobile
          minHeight: isMobile ? '60px' : 'auto',
        }}
      >
        <ThemeIcon size={isMobile ? 'xl' : 'lg'} variant="light">
          <IconUsers size={isMobile ? 24 : 20} />
        </ThemeIcon>
        <div style={{ flex: 1 }}>
          <Text size={getTextSize()} fw={600} lineClamp={1}>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {user.roles.map(role => role.name).join(', ')}
          </Text>
        </div>
      </Group>

      {/* Navigation Items */}
      <Stack gap={getSpacing()} style={{ flex: 1 }}>
        {navigationItems
          .filter(item => hasRequiredRole(item.requiredRoles))
          .map(item => {
            const IconComponent = item.icon;
            const active = isActive(item.href);

            return (
              <NavLink
                key={item.href}
                component={Link}
                to={item.href}
                label={item.label}
                leftSection={<IconComponent size={getIconSize()} />}
                active={active}
                onClick={onNavigate}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  // Touch-friendly sizing on mobile
                  minHeight: isMobile ? '48px' : '36px',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  padding: isMobile ? '0.75rem' : '0.5rem',
                }}
                styles={{
                  label: {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: isMobile ? 500 : 400,
                  },
                }}
              />
            );
          })}
      </Stack>

      {/* Logout */}
      <Divider />
      <NavLink
        label="Logout"
        leftSection={<IconLogout size={getIconSize()} />}
        onClick={handleLogout}
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
          color: 'var(--mantine-color-red-6)',
          minHeight: isMobile ? '48px' : '36px',
          fontSize: isMobile ? '1rem' : '0.875rem',
          padding: isMobile ? '0.75rem' : '0.5rem',
        }}
        styles={{
          label: {
            fontSize: isMobile ? '1rem' : '0.875rem',
            fontWeight: isMobile ? 500 : 400,
          },
        }}
      />
    </Stack>
  );
}
