import { renderHook, act } from '@testing-library/react';
import { useBrowserNotifications } from './useBrowserNotifications';
import { Notification } from '../../../types';

import { vi } from 'vitest';

// Mock the Notification API
const mockNotification = {
  close: vi.fn(),
  onclick: null,
  onerror: null,
};

const mockNotificationConstructor = vi.fn(() => mockNotification);

// Mock global Notification
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: mockNotificationConstructor,
});

Object.defineProperty(window.Notification, 'permission', {
  writable: true,
  value: 'default',
});

Object.defineProperty(window.Notification, 'requestPermission', {
  writable: true,
  value: vi.fn(),
});

const mockTestNotification: Notification = {
  id: 1,
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'info',
  userId: 1,
  read: false,
  createdAt: new Date().toISOString(),
};

describe('useBrowserNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.Notification.permission = 'default';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects browser notification support', () => {
    const { result } = renderHook(() => useBrowserNotifications());

    expect(result.current.isSupported).toBe(true);
  });

  it('returns current permission status', () => {
    window.Notification.permission = 'granted';
    
    const { result } = renderHook(() => useBrowserNotifications());

    expect(result.current.permission).toBe('granted');
  });

  it('requests permission successfully', async () => {
    (window.Notification.requestPermission as any).mockResolvedValue('granted');

    const { result } = renderHook(() => useBrowserNotifications());

    let permissionResult: NotificationPermission;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(window.Notification.requestPermission).toHaveBeenCalled();
    expect(permissionResult!).toBe('granted');
    expect(result.current.permission).toBe('granted');
  });

  it('handles permission request failure', async () => {
    (window.Notification.requestPermission as any).mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useBrowserNotifications());

    let permissionResult: NotificationPermission;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(permissionResult!).toBe('denied');
  });

  it('shows browser notification when permission is granted', () => {
    window.Notification.permission = 'granted';

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(mockTestNotification);
    });

    expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Notification', {
      body: 'This is a test notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'notification-1',
      requireInteraction: false,
      silent: false,
    });
  });

  it('does not show notification when permission is denied', () => {
    window.Notification.permission = 'denied';

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(mockTestNotification);
    });

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('requires interaction for error notifications', () => {
    window.Notification.permission = 'granted';
    const errorNotification = { ...mockTestNotification, type: 'error' as const };

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(errorNotification);
    });

    expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Notification', 
      expect.objectContaining({
        requireInteraction: true,
      })
    );
  });

  it('auto-closes non-error notifications after 5 seconds', () => {
    window.Notification.permission = 'granted';

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(mockTestNotification);
    });

    expect(mockNotification.close).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockNotification.close).toHaveBeenCalled();
  });

  it('does not auto-close error notifications', () => {
    window.Notification.permission = 'granted';
    const errorNotification = { ...mockTestNotification, type: 'error' as const };

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(errorNotification);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockNotification.close).not.toHaveBeenCalled();
  });

  it('handles notification click events', () => {
    window.Notification.permission = 'granted';
    const notificationWithUrl = { 
      ...mockTestNotification, 
      actionUrl: '/test-url' 
    };

    // Mock window.focus and location.href
    const mockFocus = vi.fn();
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'focus', { value: mockFocus });
    Object.defineProperty(window, 'location', { value: mockLocation });

    const { result } = renderHook(() => useBrowserNotifications());

    act(() => {
      result.current.showBrowserNotification(notificationWithUrl);
    });

    // Simulate click event
    act(() => {
      mockNotification.onclick?.({} as Event);
    });

    expect(mockFocus).toHaveBeenCalled();
    expect(mockNotification.close).toHaveBeenCalled();
    expect(mockLocation.href).toBe('/test-url');
  });

  it('returns denied permission when not supported', async () => {
    // Mock unsupported browser
    Object.defineProperty(window, 'Notification', {
      value: undefined,
    });

    const { result } = renderHook(() => useBrowserNotifications());

    expect(result.current.isSupported).toBe(false);

    let permissionResult: NotificationPermission;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(permissionResult!).toBe('denied');
  });
});