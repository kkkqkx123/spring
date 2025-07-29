import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationStore } from '../../../stores/notificationStore';
import { Notification } from '../../../types';

import { vi } from 'vitest';

// Mock the notification store
vi.mock('../../../stores/notificationStore');
const mockUseNotificationStore = useNotificationStore as any;

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Test Notification 1',
    message: 'This is a test notification',
    type: 'info',
    userId: 1,
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Test Notification 2',
    message: 'This is another test notification',
    type: 'success',
    userId: 1,
    read: true,
    createdAt: new Date().toISOString(),
  },
];

const mockStore = {
  notifications: mockNotifications,
  unreadCount: 1,
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
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('NotificationDropdown', () => {
  beforeEach(() => {
    mockUseNotificationStore.mockReturnValue(mockStore);
    vi.clearAllMocks();
  });

  it('renders notification badge with correct unread count', () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    expect(badge).toBeInTheDocument();
    
    // Check for unread indicator
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
    });

    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    expect(badge).toHaveAttribute('data-loading', 'true');
  });

  it('opens dropdown when clicked', async () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
    });
  });

  it('displays notifications in dropdown', async () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
      expect(screen.getByText('Test Notification 2')).toBeInTheDocument();
    });
  });

  it('shows "Mark all as read" button when there are unread notifications', async () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });
  });

  it('calls markAsRead when notification is clicked', async () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      const notification = screen.getByTestId('notification-item-1');
      fireEvent.click(notification);
      expect(mockStore.markAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('calls markAllAsRead when "Mark all as read" is clicked', async () => {
    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      const markAllButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllButton);
      expect(mockStore.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('shows empty state when no notifications', async () => {
    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      notifications: [],
      unreadCount: 0,
    });

    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  it('calls onViewAll when "View all notifications" is clicked', async () => {
    const onViewAll = vi.fn();
    renderWithProvider(<NotificationDropdown onViewAll={onViewAll} />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      const viewAllButton = screen.getByText('View all notifications');
      fireEvent.click(viewAllButton);
      expect(onViewAll).toHaveBeenCalled();
    });
  });

  it('limits notifications to 10 items', async () => {
    const manyNotifications = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Notification ${i + 1}`,
      message: `Message ${i + 1}`,
      type: 'info' as const,
      userId: 1,
      read: false,
      createdAt: new Date().toISOString(),
    }));

    mockUseNotificationStore.mockReturnValue({
      ...mockStore,
      notifications: manyNotifications,
      unreadCount: 15,
    });

    renderWithProvider(<NotificationDropdown />);
    
    const badge = screen.getByLabelText('Notifications');
    fireEvent.click(badge);

    await waitFor(() => {
      // Should only show first 10 notifications
      expect(screen.getByText('Notification 1')).toBeInTheDocument();
      expect(screen.getByText('Notification 10')).toBeInTheDocument();
      expect(screen.queryByText('Notification 11')).not.toBeInTheDocument();
    });
  });
});