import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';
import { useNotificationStore } from '../../../stores/notificationStore';
import { Notification } from '../../../types';

import { vi } from 'vitest';

// Mock the notification store
vi.mock('../../../stores/notificationStore');
const mockUseNotificationStore = useNotificationStore as any;

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Test Notification',
    message: 'Test message',
    type: 'info',
    userId: 1,
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const mockStore = {
  notifications: mockNotifications,
  unreadCount: 1,
  isLoading: false,
  addNotification: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  removeNotification: vi.fn(),
  clearNotifications: vi.fn(),
  getUnreadNotifications: vi.fn(() => mockNotifications.filter(n => !n.read)),
  setNotifications: vi.fn(),
  updateNotification: vi.fn(),
  setUnreadCount: vi.fn(),
  setLoading: vi.fn(),
  getNotificationById: vi.fn(),
};

describe('useNotifications', () => {
  beforeEach(() => {
    mockUseNotificationStore.mockReturnValue(mockStore);
    vi.clearAllMocks();
  });

  it('returns notification store state', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('provides store actions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.markAllAsRead).toBe('function');
    expect(typeof result.current.removeNotification).toBe('function');
    expect(typeof result.current.clearNotifications).toBe('function');
    expect(typeof result.current.getUnreadNotifications).toBe('function');
  });

  it('adds notification with generated id and timestamp', () => {
    const { result } = renderHook(() => useNotifications());

    const notificationData = {
      title: 'New Notification',
      message: 'New message',
      type: 'success' as const,
      userId: 1,
      read: false,
    };

    act(() => {
      result.current.addNotification(notificationData);
    });

    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        ...notificationData,
        id: expect.any(Number),
        createdAt: expect.any(String),
      })
    );
  });

  it('shows notification with default type', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showNotification('Test Title', 'Test Message');
    });

    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
        userId: 1,
        read: false,
      })
    );
  });

  it('shows notification with specified type', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showNotification('Error Title', 'Error Message', 'error');
    });

    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error Title',
        message: 'Error Message',
        type: 'error',
        userId: 1,
        read: false,
      })
    );
  });

  it('calls store markAsRead', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.markAsRead(1);
    });

    expect(mockStore.markAsRead).toHaveBeenCalledWith(1);
  });

  it('calls store markAllAsRead', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.markAllAsRead();
    });

    expect(mockStore.markAllAsRead).toHaveBeenCalled();
  });

  it('calls store removeNotification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.removeNotification(1);
    });

    expect(mockStore.removeNotification).toHaveBeenCalledWith(1);
  });

  it('calls store clearNotifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.clearNotifications();
    });

    expect(mockStore.clearNotifications).toHaveBeenCalled();
  });

  it('calls store getUnreadNotifications', () => {
    const { result } = renderHook(() => useNotifications());

    const unreadNotifications = result.current.getUnreadNotifications();

    expect(mockStore.getUnreadNotifications).toHaveBeenCalled();
    expect(unreadNotifications).toEqual(mockNotifications);
  });
});
