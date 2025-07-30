import { useAuthStore } from './authStore';
import { useUiStore } from './uiStore';
import { useNotificationStore } from './notificationStore';
import { createMemoizedSelector } from '../utils/memoization';

/**
 * Optimized selectors for Zustand stores to prevent unnecessary re-renders
 */

// Auth store selectors
export const authSelectors = {
  // Basic selectors
  user: createMemoizedSelector((state: ReturnType<typeof useAuthStore.getState>) => state.user),
  token: createMemoizedSelector((state: ReturnType<typeof useAuthStore.getState>) => state.token),
  isAuthenticated: createMemoizedSelector((state: ReturnType<typeof useAuthStore.getState>) => state.isAuthenticated),
  isLoading: createMemoizedSelector((state: ReturnType<typeof useAuthStore.getState>) => state.isLoading),

  // Computed selectors
  userRoles: createMemoizedSelector(
    (state: ReturnType<typeof useAuthStore.getState>) => 
      state.user?.roles?.map(role => role.name) || [],
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  userPermissions: createMemoizedSelector(
    (state: ReturnType<typeof useAuthStore.getState>) => {
      if (!state.user?.roles) return [];
      return state.user.roles.flatMap(role => 
        role.permissions.map(permission => permission.name)
      );
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  userInfo: createMemoizedSelector(
    (state: ReturnType<typeof useAuthStore.getState>) => ({
      id: state.user?.id,
      username: state.user?.username,
      email: state.user?.email,
      firstName: state.user?.firstName,
      lastName: state.user?.lastName,
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  authStatus: createMemoizedSelector(
    (state: ReturnType<typeof useAuthStore.getState>) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasUser: !!state.user,
      hasToken: !!state.token,
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),
};

// UI store selectors
export const uiSelectors = {
  // Basic selectors
  theme: createMemoizedSelector((state: ReturnType<typeof useUiStore.getState>) => state.theme),
  sidebarCollapsed: createMemoizedSelector((state: ReturnType<typeof useUiStore.getState>) => state.sidebarCollapsed),
  loading: createMemoizedSelector((state: ReturnType<typeof useUiStore.getState>) => state.loading),
  notifications: createMemoizedSelector(
    (state: ReturnType<typeof useUiStore.getState>) => state.notifications,
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  // Computed selectors
  notificationCount: createMemoizedSelector(
    (state: ReturnType<typeof useUiStore.getState>) => state.notifications.length
  ),

  hasNotifications: createMemoizedSelector(
    (state: ReturnType<typeof useUiStore.getState>) => state.notifications.length > 0
  ),

  uiState: createMemoizedSelector(
    (state: ReturnType<typeof useUiStore.getState>) => ({
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      loading: state.loading,
      notificationCount: state.notifications.length,
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  notificationsByType: createMemoizedSelector(
    (state: ReturnType<typeof useUiStore.getState>) => {
      const byType: Record<string, typeof state.notifications> = {};
      state.notifications.forEach(notification => {
        if (!byType[notification.type]) {
          byType[notification.type] = [];
        }
        byType[notification.type].push(notification);
      });
      return byType;
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),
};

// Notification store selectors
export const notificationSelectors = {
  // Basic selectors
  notifications: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => state.notifications,
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),
  unreadCount: createMemoizedSelector((state: ReturnType<typeof useNotificationStore.getState>) => state.unreadCount),
  isLoading: createMemoizedSelector((state: ReturnType<typeof useNotificationStore.getState>) => state.isLoading),
  lastUpdated: createMemoizedSelector((state: ReturnType<typeof useNotificationStore.getState>) => state.lastUpdated),

  // Computed selectors
  unreadNotifications: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => 
      state.notifications.filter(n => !n.read),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  readNotifications: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => 
      state.notifications.filter(n => n.read),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  notificationsByType: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => {
      const byType: Record<string, typeof state.notifications> = {};
      state.notifications.forEach(notification => {
        if (!byType[notification.type]) {
          byType[notification.type] = [];
        }
        byType[notification.type].push(notification);
      });
      return byType;
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  recentNotifications: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return state.notifications.filter(n => n.createdAt > oneHourAgo);
    },
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),

  notificationStats: createMemoizedSelector(
    (state: ReturnType<typeof useNotificationStore.getState>) => ({
      total: state.notifications.length,
      unread: state.unreadCount,
      read: state.notifications.length - state.unreadCount,
      lastUpdated: state.lastUpdated,
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ),
};

// Hooks for using optimized selectors
export function useOptimizedAuthSelector<T>(selector: (state: ReturnType<typeof useAuthStore.getState>) => T) {
  return useAuthStore(selector);
}

export function useOptimizedUiSelector<T>(selector: (state: ReturnType<typeof useUiStore.getState>) => T) {
  return useUiStore(selector);
}

export function useOptimizedNotificationSelector<T>(selector: (state: ReturnType<typeof useNotificationStore.getState>) => T) {
  return useNotificationStore(selector);
}

// Convenience hooks for common selectors
export function useAuthUser() {
  return useAuthStore(authSelectors.user);
}

export function useAuthStatus() {
  return useAuthStore(authSelectors.authStatus);
}

export function useUserPermissions() {
  return useAuthStore(authSelectors.userPermissions);
}

export function useUserRoles() {
  return useAuthStore(authSelectors.userRoles);
}

export function useUiTheme() {
  return useUiStore(uiSelectors.theme);
}

export function useUiState() {
  return useUiStore(uiSelectors.uiState);
}

export function useNotificationStats() {
  return useNotificationStore(notificationSelectors.notificationStats);
}

export function useUnreadNotifications() {
  return useNotificationStore(notificationSelectors.unreadNotifications);
}

// Combined selectors for complex state
export function useAppState() {
  const authStatus = useAuthStatus();
  const uiState = useUiState();
  const notificationStats = useNotificationStats();

  return {
    auth: authStatus,
    ui: uiState,
    notifications: notificationStats,
  };
}