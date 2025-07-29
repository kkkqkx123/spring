import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { NotificationBadge } from './NotificationBadge';
import { useNotificationStore } from '../../../stores/notificationStore';

import { vi } from 'vitest';

// Mock the notification store
vi.mock('../../../stores/notificationStore');
const mockUseNotificationStore = useNotificationStore as any;

const mockStore = {
  notifications: [],
  unreadCount: 5,
  isLoading: false,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  setNotifications: vi.fn(),
  addNotification: vi.fn(),
  updateNotification: vi.fn(),
  removeNotification: vi.fn(),
  clearNotifications: vi.fn(),
  setUnreadCount: vi.fn(),
  setLoading: vi.fn(),
  getUnreadNotifications: vi.fn(),
  getNotificationById: vi.fn(),
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('NotificationBadge', () => {
  beforeEach(() => {
    mockUseNotificationStore.mockReturnValue(mockStore);
    vi.clearAllMocks();
  });

  it('renders with correct unread count', () => {
    renderWithProvider(<NotificationBadge />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toBeInTheDocument();

    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      unreadCount: 150,
    });

    renderWithProvider(<NotificationBadge />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('hides indicator when unread count is 0', () => {
    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      unreadCount: 0,
    });

    renderWithProvider(<NotificationBadge />);

    // When disabled, the indicator should not show the count
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();

    renderWithProvider(<NotificationBadge onClick={onClick} />);

    const badge = screen.getByTestId('notification-badge');
    fireEvent.click(badge);

    expect(onClick).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    renderWithProvider(<NotificationBadge loading />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveAttribute('data-loading', 'true');
  });

  it('applies correct size variants', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      const { unmount } = renderWithProvider(<NotificationBadge size={size} />);

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveAttribute('data-size', size);

      unmount();
    });
  });

  it('applies correct variant styles', () => {
    const variants = ['subtle', 'filled', 'outline'] as const;

    variants.forEach(variant => {
      const { unmount } = renderWithProvider(
        <NotificationBadge variant={variant} />
      );

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveAttribute('data-variant', variant);

      unmount();
    });
  });

  it('has correct aria-label', () => {
    renderWithProvider(<NotificationBadge />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveAttribute('aria-label', 'Notifications (5 unread)');
  });

  it('has correct aria-label when no unread notifications', () => {
    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      unreadCount: 0,
    });

    renderWithProvider(<NotificationBadge />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveAttribute('aria-label', 'Notifications');
  });
});
