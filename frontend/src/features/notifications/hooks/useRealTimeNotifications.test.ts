/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import * as hooks from './useRealTimeNotifications';
import { useRealTimeNotifications } from './useRealTimeNotifications';
import { useNotificationStore } from '../../../stores/notificationStore';
import { webSocketService } from '../../../services/websocket';
import { useBrowserNotifications } from './useBrowserNotifications';
import { useNotificationPreferences } from './useNotificationPreferences';
import { notificationApi } from '../services/notificationApi';
import type { Notification } from '../../../types';

// Mock dependencies
vi.mock('../../../stores/notificationStore');
vi.mock('../../../services/websocket', () => ({
  webSocketService: {
    subscribe: vi.fn(),
    markNotificationAsRead: vi.fn(),
    isConnected: vi.fn(() => true),
    getConnectionState: vi.fn(() => 'connected' as const),
  },
}));
vi.mock('./useBrowserNotifications');
vi.mock('./useNotificationPreferences');
vi.mock('../services/notificationApi', () => ({
  notificationApi: {
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    deleteAllRead: vi.fn(),
  },
}));

// Mock the playNotificationSound function
const playSoundSpy = vi
  .spyOn(hooks, 'playNotificationSound')
  .mockImplementation(() => {});

const mockNotificationStore = {
  addNotification: vi.fn(),
  updateNotification: vi.fn(),
  setUnreadCount: vi.fn(),
  removeNotification: vi.fn(),
  notifications: [] as Notification[],
};

const mockBrowserNotifications = {
  showBrowserNotification: vi.fn(),
  permission: 'granted' as NotificationPermission,
  isSupported: true,
  requestPermission: vi.fn(),
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
  updatePreferences: vi.fn(),
  resetPreferences: vi.fn(),
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

    // Mock unsubscribe functions
    (webSocketService.subscribe as any).mockReturnValue(() => {});

    // Mock API responses
    (notificationApi.markAsRead as any).mockResolvedValue(mockNotification);
    (notificationApi.markAllAsRead as any).mockResolvedValue(undefined);
    (notificationApi.deleteNotification as any).mockResolvedValue(undefined);
    (notificationApi.deleteAllRead as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up WebSocket event listeners on mount', () => {
    renderHook(() => useRealTimeNotifications());

    expect(webSocketService.subscribe).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function)
    );
    expect(webSocketService.subscribe).toHaveBeenCalledWith(
      'notification:read',
      expect.any(Function)
    );
    expect(webSocketService.subscribe).toHaveBeenCalledWith(
      'notification:count-updated',
      expect.any(Function)
    );
  });

  it('handles new notifications from WebSocket', () => {
    renderHook(() => useRealTimeNotifications());

    // Get the callback function passed to subscribe
    const newNotificationCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) => call[0] === 'notification:new'
    )[1];

    // Simulate receiving a new notification
    act(() => {
      newNotificationCallback(mockNotification);
    });

    expect(mockNotificationStore.addNotification).toHaveBeenCalledWith(
      mockNotification
    );
    expect(
      mockBrowserNotifications.showBrowserNotification
    ).toHaveBeenCalledWith(mockNotification);
    expect(playSoundSpy).toHaveBeenCalledWith('info');
  });

  it('does not show browser notification when permission is denied', () => {
    (useBrowserNotifications as any).mockReturnValue({
      ...mockBrowserNotifications,
      permission: 'denied',
    });

    renderHook(() => useRealTimeNotifications());

    const newNotificationCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) => call[0] === 'notification:new'
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

    const newNotificationCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) => call[0] === 'notification:new'
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

    const newNotificationCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) => call[0] === 'notification:new'
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

    const notificationReadCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) => call[0] === 'notification:read'
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

    const countUpdateCallback = (
      webSocketService.subscribe as any
    ).mock.calls.find(
      (call: [string, (data: any) => void]) =>
        call[0] === 'notification:count-updated'
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
    expect(webSocketService.markNotificationAsRead).toHaveBeenCalledWith(1);
    expect(notificationApi.markAsRead).toHaveBeenCalledWith(1);
  });

  it('reverts local changes when mark as read fails', async () => {
    (notificationApi.markAsRead as any).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      try {
        await result.current.markAsRead(1);
      } catch (error) {
        console.error(error);
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
    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
    expect(mockNotificationStore.setUnreadCount).toHaveBeenCalledWith(0);
  });

  it('archives notification', async () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    await act(async () => {
      await result.current.archiveNotification(1);
    });

    expect(mockNotificationStore.removeNotification).toHaveBeenCalledWith(1);
    expect(notificationApi.deleteNotification).toHaveBeenCalledWith(1);
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
    expect(mockNotificationStore.removeNotification).not.toHaveBeenCalledWith(
      2
    );
    expect(mockNotificationStore.removeNotification).not.toHaveBeenCalledWith(
      3
    );
    expect(notificationApi.deleteAllRead).toHaveBeenCalled();
  });

  it('returns connection state', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('cleans up event listeners on unmount', () => {
    const unsubscribeFn = vi.fn();
    (webSocketService.subscribe as any).mockReturnValue(unsubscribeFn);

    const { unmount } = renderHook(() => useRealTimeNotifications());

    unmount();

    expect(unsubscribeFn).toHaveBeenCalledTimes(3);
  });

  it('sets up periodic cleanup on mount', () => {
    vi.useFakeTimers();

    renderHook(() => useRealTimeNotifications());

    // Fast-forward 24 hours
    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    // Should have called cleanup again
    expect(notificationApi.deleteAllRead).toHaveBeenCalledTimes(2); // Once on mount, once after 24h

    vi.useRealTimers();
  });
});
