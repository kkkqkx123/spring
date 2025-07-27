import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUiStore } from './uiStore';

// Mock setTimeout for notification auto-removal tests
vi.useFakeTimers();

describe('UiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useUiStore.getState();
    store.setTheme('light');
    store.setSidebarCollapsed(false);
    store.setLoading(false);
    store.clearNotifications();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUiStore.getState();

      expect(state.theme).toBe('light');
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.notifications).toEqual([]);
    });
  });

  describe('Theme Management', () => {
    it('should set theme correctly', () => {
      const { setTheme } = useUiStore.getState();

      setTheme('dark');
      expect(useUiStore.getState().theme).toBe('dark');

      setTheme('auto');
      expect(useUiStore.getState().theme).toBe('auto');

      setTheme('light');
      expect(useUiStore.getState().theme).toBe('light');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar correctly', () => {
      const { toggleSidebar } = useUiStore.getState();

      expect(useUiStore.getState().sidebarCollapsed).toBe(false);

      toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);

      toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed state directly', () => {
      const { setSidebarCollapsed } = useUiStore.getState();

      setSidebarCollapsed(true);
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);

      setSidebarCollapsed(false);
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should set loading state correctly', () => {
      const { setLoading } = useUiStore.getState();

      setLoading(true);
      expect(useUiStore.getState().loading).toBe(true);

      setLoading(false);
      expect(useUiStore.getState().loading).toBe(false);
    });
  });

  describe('Notification Management', () => {
    it('should add notification correctly', () => {
      const { addNotification } = useUiStore.getState();

      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully',
      };

      addNotification(notification);

      const state = useUiStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject(notification);
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].autoClose).toBe(true);
      expect(state.notifications[0].duration).toBe(5000);
    });

    it('should add notification with custom settings', () => {
      const { addNotification } = useUiStore.getState();

      const notification = {
        type: 'error' as const,
        title: 'Error',
        message: 'Something went wrong',
        autoClose: false,
        duration: 10000,
      };

      addNotification(notification);

      const state = useUiStore.getState();
      expect(state.notifications[0].autoClose).toBe(false);
      expect(state.notifications[0].duration).toBe(10000);
    });

    it('should remove notification correctly', () => {
      const { addNotification, removeNotification } = useUiStore.getState();

      addNotification({
        type: 'info',
        title: 'Info',
        message: 'Information message',
      });

      const notificationId = useUiStore.getState().notifications[0].id;

      removeNotification(notificationId);

      expect(useUiStore.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useUiStore.getState();

      addNotification({
        type: 'success',
        title: 'Success 1',
        message: 'Message 1',
      });

      addNotification({
        type: 'error',
        title: 'Error 1',
        message: 'Message 2',
      });

      expect(useUiStore.getState().notifications).toHaveLength(2);

      clearNotifications();

      expect(useUiStore.getState().notifications).toHaveLength(0);
    });

    it('should auto-remove notification after duration', () => {
      const { addNotification } = useUiStore.getState();

      addNotification({
        type: 'success',
        title: 'Auto Remove',
        message: 'This should be removed automatically',
        duration: 3000,
      });

      expect(useUiStore.getState().notifications).toHaveLength(1);

      // Fast-forward time by 3000ms
      vi.advanceTimersByTime(3000);

      expect(useUiStore.getState().notifications).toHaveLength(0);
    });

    it('should not auto-remove notification when autoClose is false', () => {
      const { addNotification } = useUiStore.getState();

      addNotification({
        type: 'error',
        title: 'Persistent Error',
        message: 'This should not be removed automatically',
        autoClose: false,
      });

      expect(useUiStore.getState().notifications).toHaveLength(1);

      // Fast-forward time by default duration
      vi.advanceTimersByTime(5000);

      expect(useUiStore.getState().notifications).toHaveLength(1);
    });

    it('should handle multiple notifications correctly', () => {
      const { addNotification } = useUiStore.getState();

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Success message',
      });

      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Warning message',
      });

      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error message',
      });

      const state = useUiStore.getState();
      expect(state.notifications).toHaveLength(3);

      // Check that each notification has a unique ID
      const ids = state.notifications.map(n => n.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle removing non-existent notification', () => {
      const { removeNotification } = useUiStore.getState();

      // Should not throw error
      removeNotification('non-existent-id');

      expect(useUiStore.getState().notifications).toHaveLength(0);
    });

    it('should handle clearing notifications when none exist', () => {
      const { clearNotifications } = useUiStore.getState();

      // Should not throw error
      clearNotifications();

      expect(useUiStore.getState().notifications).toHaveLength(0);
    });
  });
});
