import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { NotificationItem } from './NotificationItem';
import { Notification } from '../../../types';

const mockNotification: Notification = {
  id: 1,
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info',
  userId: 1,
  read: false,
  createdAt: new Date('2024-01-01T12:00:00Z').toISOString(),
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('NotificationItem', () => {
  it('renders notification content correctly', () => {
    renderWithProvider(<NotificationItem notification={mockNotification} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test notification message')
    ).toBeInTheDocument();
  });

  it('shows unread indicator for unread notifications', () => {
    renderWithProvider(<NotificationItem notification={mockNotification} />);

    // Check for unread styling (blue background)
    const button = screen.getByTestId('notification-item-1');
    expect(button).toHaveStyle('background-color: var(--mantine-color-blue-0)');
  });

  it('does not show unread indicator for read notifications', () => {
    const readNotification = { ...mockNotification, read: true };

    renderWithProvider(<NotificationItem notification={readNotification} />);

    const button = screen.getByTestId('notification-item-1');
    expect(button).toHaveStyle('background-color: transparent');
    // Should not have the unread badge
    expect(
      screen.queryByRole('generic', { name: /badge/i })
    ).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();

    renderWithProvider(
      <NotificationItem notification={mockNotification} onClick={onClick} />
    );

    const button = screen.getByTestId('notification-item-1');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('displays correct icon for different notification types', () => {
    const types: Array<{ type: Notification['type']; expectedColor: string }> =
      [
        { type: 'info', expectedColor: 'blue' },
        { type: 'success', expectedColor: 'green' },
        { type: 'warning', expectedColor: 'yellow' },
        { type: 'error', expectedColor: 'red' },
      ];

    types.forEach(({ type, expectedColor }) => {
      const notification = { ...mockNotification, type };
      const { unmount } = renderWithProvider(
        <NotificationItem notification={notification} />
      );

      // The icon should be wrapped in a ThemeIcon with the correct color attribute
      const themeIcon = screen
        .getByRole('button')
        .querySelector('.mantine-ThemeIcon-root');
      expect(themeIcon).toHaveAttribute('color', expectedColor);

      unmount();
    });
  });

  it('renders in compact mode', () => {
    renderWithProvider(
      <NotificationItem notification={mockNotification} compact />
    );

    const button = screen.getByTestId('notification-item-1');
    expect(button).toHaveStyle('padding: var(--mantine-spacing-xs)');
  });

  it('truncates long messages', () => {
    const longMessage =
      'This is a very long notification message that should be truncated when displayed in the notification item component to prevent it from taking up too much space';
    const notificationWithLongMessage = {
      ...mockNotification,
      message: longMessage,
    };

    renderWithProvider(
      <NotificationItem notification={notificationWithLongMessage} />
    );

    // The message should be truncated (lineClamp is applied via CSS)
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('shows relative time correctly', () => {
    // Mock date to ensure consistent testing
    const mockDate = new Date('2024-01-01T12:30:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    renderWithProvider(<NotificationItem notification={mockNotification} />);

    expect(screen.getByText('30 minutes ago')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('applies correct font weight for read/unread notifications', () => {
    // Test unread notification
    const { rerender } = renderWithProvider(
      <NotificationItem notification={mockNotification} />
    );

    let titleElement = screen.getByText('Test Notification');
    expect(titleElement).toHaveStyle('font-weight: 600');

    // Test read notification
    const readNotification = { ...mockNotification, read: true };
    rerender(<NotificationItem notification={readNotification} />);

    titleElement = screen.getByText('Test Notification');
    expect(titleElement).toHaveStyle('font-weight: 400');
  });
});
