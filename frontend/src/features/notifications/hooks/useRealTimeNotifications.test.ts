import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { useRealTimeNotifications } from './useRealTimeNotifications';
import { useNotificationStore } from '../../../stores/notificationStore';
import { webSocketService } from '../../../services/websocket';
import { useBrowserNotifications } from './useBrowserNotifications';
import { useNotificationPreferences } from './useNotificationPreferences';
import { notificationApi } from '../services/notificationApi';
import { Notification } from '../../../types';

// Mock dependencies
vi.mock('../../../stores/notificationStore');
vi.mock('../../../services/websocket');
vi.mock('./useBrowserNotifications');
vi.mock('./useNotificationPreferences');
vi.mock('../services/notificationApi');

const mockNotificationStore = {
  addNotification: vi.fn(),
  updateNotification: vi.fn(),
  setUnreadCount: vi.fn(),
  removeNotification: vi.fn(),
  notifications: [],
};

const mockBrowserNotifications = {
  showBrowserNotification: vi.fn(),
  permission: 'granted' as NotificationPermission,
};

const mockPreferences = {
  preferences: {
    browserNotifications: true,
    soundEnabled: true,
    notificationTypes: {
      info: true,
      success: true,
      warning: true,
      error: true,
    },
  },
  isInQuietHours: vi.fn(() => false),
  shouldShowNotification: vi.fn(() => true),
};

const mockWebSocketService = {
  subscribe: vi.fn(),
  markNotificationAsRead: vi.fn(),
  isConnected: vi.fn(() => true),
  getConnectionState: vi.fn(() => 'connected' as const),
};

const mockNotificationApi = {
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllRead: vi.fn(),
};

const mockNotification: Notification = {
  id: 1,
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'info',
  userId: 1,
  read: false,
  createdAt: new Date().toISOString(),
};

describe('useRealTimeNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useNotificationStore as any).mockReturnValue(mockNotificationStore);
    (useBrowserNotifications as any).mockReturnValue(mockBrowserNotifications);
    (useNotificationPreferences as any).mockReturnValue(mockPreferences);
    (webSocketService as any).subscribe = mockWebSocketService.subscribe;
    (webSocketService as any).markNotificationAsRead =
      mockWebSocketService.markNotificationAsRead;
    (webSocketService as any).isConnected = mockWebSocketService.isConnected;
    (webSocketService as any).getConnectionState =
      mockWebSocketService.getConnectionState;
    (notificationApi as any).markAsRead = mockNotificationApi.markAsRead;
    (notificationApi as any).markAllAsRead = mockNotificationApi.markAllAsRead;
    (notificationApi as any).deleteNotification =
      mockNotificationApi.deleteNotification;
    (notificationApi as any).deleteAllRead = mockNotificationApi.deleteAllRead;

    // Mock unsubscribe functions
    mockWebSocketService.subscribe.mockReturnValue(() => {});

    // Mock API responses
    mockNotificationApi.markAsRead.mockResolvedValue(undefined);
    mockNotificationApi.markAllAsRead.mockResolvedValue(undefined);
    mockNotificationApi.deleteNotification.mockResolvedValue(undefined);
    mockNotificationApi.deleteAllRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up WebSocket event listeners on mount', () => {
    renderHook(() => useRealTimeNotifications());

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function)
    );
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'notification:read',
      expect.any(Function)
    );
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'notification:count-updated',
      expect.any(Function)
    );
  });

  it('handles new notifications from WebSocket', () => {
    renderHook(() => useRealTimeNotifications());

    // Get the callback function passed to subscribe
    const newNotificationCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:new'
    )[1];

    // Simulate receiving a new notification
    act(() => {
      newNotificationCallback(mockNotification);
    });

    expect(mockNotificationStore.addNotification).toHaveBeenCalledWith(
      mockNotification
    );
    expect(mockBrowserNotifications.showBrowserNotification).toHaveBeenCalledWith(
      mockNotification
    );
  });

  it('does not show browser notification when permission is denied', () => {
    (useBrowserNotifications as any).mockReturnValue({
      ...mockBrowserNotifications,
      permission: 'denied',
    });

    renderHook(() => useRealTimeNotifications());

    const newNotificationCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:new'
    )[1];

    act(() => {
      newNotificationCallback(mockNotification);
    });

    expect(mockNotificationStore.addNotification).toHaveBeenCalledWith(
      mockNotification
    );
    expect(
      mockBrowserNotifications.showBrowserNotification
    ).not.toHaveBeenCalled();
  });

  it('does not show notification during quiet hours', () => {
    mockPreferences.isInQuietHours.mockReturnValue(true);

    renderHook(() => useRealTimeNotifications());

    const newNotificationCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:new'
    )[1];

    act(() => {
      newNotificationCallback(mockNotification);
    });

    expect(mockNotificationStore.addNotification).toHaveBeenCalledWith(
      mockNotification
    );
    expect(
      mockBrowserNotifications.showBrowserNotification
    ).not.toHaveBeenCalled();
  });

  it('does not show notification when type is disabled', () => {
    mockPreferences.shouldShowNotification.mockReturnValue(false);

    renderHook(() => useRealTimeNotifications());

    const newNotificationCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:new'
    )[1];

    act(() => {
      newNotificationCallback(mockNotification);
    });

    expect(mockNotificationStore.addNotification).toHaveBeenCalledWith(
      mockNotification
    );
    expect(
      mockBrowserNotifications.showBrowserNotification
    ).not.toHaveBeenCalled();
  });

  it('handles notification read updates from WebSocket', () => {
    renderHook(() => useRealTimeNotifications());

    const notificationReadCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:read'
    )[1];

    act(() => {
      notificationReadCallback({ notificationId: 1 });
    });

    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(1, {
      read: true,
    });
  });

  it('handles unread count updates from WebSocket', () => {
    renderHook(() => useRealTimeNotifications());

    const countUpdateCallback = mockWebSocketService.subscribe.mock.calls.find(
      call => call[0] === 'notification:count-updated'
    )[1];

    act(() => {
      countUpdateCallback({ count: 5 });
    });

    expect(mockNotificationStore.setUnreadCount).toHaveBeenCalledWith(5);
  });

  it('marks notification as read', async () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      await result.current.markAsRead(1);
    });

    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(1, {
      read: true,
    });
    expect(mockWebSocketService.markNotificationAsRead).toHaveBeenCalledWith(1);
    expect(mockNotificationApi.markAsRead).toHaveBeenCalledWith(1);
  });

  it('reverts local changes when mark as read fails', async () => {
    mockNotificationApi.markAsRead.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      try {
        await result.current.markAsRead(1);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(1, {
      read: true,
    });
    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(1, {
      read: false,
    });
  });

  it('marks all notifications as read', async () => {
    mockNotificationStore.notifications = [
      { ...mockNotification, id: 1, read: false },
      { ...mockNotification, id: 2, read: false },
      { ...mockNotification, id: 3, read: true },
    ];

    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(1, {
      read: true,
    });
    expect(mockNotificationStore.updateNotification).toHaveBeenCalledWith(2, {
      read: true,
    });
    expect(mockNotificationApi.markAllAsRead).toHaveBeenCalled();
    expect(mockNotificationStore.setUnreadCount).toHaveBeenCalledWith(0);
  });

  it('archives notification', async () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      await result.current.archiveNotification(1);
    });

    expect(mockNotificationStore.removeNotification).toHaveBeenCalledWith(1);
    expect(mockNotificationApi.deleteNotification).toHaveBeenCalledWith(1);
  });

  it('cleans up old notifications', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31); // 31 days ago

    mockNotificationStore.notifications = [
      {
        ...mockNotification,
        id: 1,
        read: true,
        createdAt: oldDate.toISOString(),
      },
      {
        ...mockNotification,
        id: 2,
        read: false,
        createdAt: oldDate.toISOString(),
      },
      {
        ...mockNotification,
        id: 3,
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      await result.current.cleanupOldNotifications();
    });

    // Should only remove old read notifications
    expect(mockNotificationStore.removeNotification).toHaveBeenCalledWith(1);
    expect(mockNotificationStore.removeNotification).not.toHaveBeenCalledWith(2);
    expect(mockNotificationStore.removeNotification).not.toHaveBeenCalledWith(3);
    expect(mockNotificationApi.deleteAllRead).toHaveBeenCalled();
  });

  it('returns connection state', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('cleans up event listeners on unmount', () => {
    const unsubscribeFn = vi.fn();
    mockWebSocketService.subscribe.mockReturnValue(unsubscribeFn);

    const { unmount } = renderHook(() => useRealTimeNotifications());

    unmount();

    expect(unsubscribeFn).toHaveBeenCalledTimes(3); // Three event listeners
  });

  it('sets up periodic cleanup on mount', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useRealTimeNotifications());

    // Fast-forward 24 hours
    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    // Should have called cleanup again
    expect(mockNotificationApi.deleteAllRead).toHaveBeenCalledTimes(2); // Once on mount, once after 24h

    vi.useRealTimers();
  });
});