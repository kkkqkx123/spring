import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

interface UiState {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    autoClose?: boolean;
    duration?: number;
  }>;
}

interface UiActions {
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (
    notification: Omit<UiState['notifications'][0], 'id'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'light',
      sidebarCollapsed: false,
      loading: false,
      notifications: [],

      // Actions
      setTheme: theme =>
        set({
          theme,
        }),

      toggleSidebar: () =>
        set(state => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: collapsed =>
        set({
          sidebarCollapsed: collapsed,
        }),

      setLoading: loading =>
        set({
          loading,
        }),

      addNotification: notification => {
        const id = Math.random().toString(36).substr(2, 9);
        set(state => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id,
              autoClose: notification.autoClose ?? true,
              duration: notification.duration ?? 5000,
            },
          ],
        }));

        // Auto-remove notification if autoClose is enabled
        if (notification.autoClose !== false) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration ?? 5000);
        }
      },

      removeNotification: id =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),

      clearNotifications: () =>
        set({
          notifications: [],
        }),
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: state => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
