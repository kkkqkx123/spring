import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, type Role, type Permission } from '../types';
import { STORAGE_KEYS } from '../constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: user =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: token =>
        set({
          token,
        }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: loading =>
        set({
          isLoading: loading,
        }),

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;

        return user.roles.some((role: Role) =>
          role.permissions.some((p: Permission) => p.name === permission)
        );
      },

      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;

        return user.roles.some((r: Role) => r.name === role);
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
