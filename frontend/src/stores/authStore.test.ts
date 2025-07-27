import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { type User, type Role, type Permission } from '../types';

// Mock user data
const mockPermission: Permission = {
  id: 1,
  name: 'READ_EMPLOYEES',
  description: 'Can read employee data',
};

const mockRole: Role = {
  id: 1,
  name: 'HR_MANAGER',
  permissions: [mockPermission],
};

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [mockRole],
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Authentication Actions', () => {
    it('should set user correctly', () => {
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set token correctly', () => {
      const { setToken } = useAuthStore.getState();
      const testToken = 'test-jwt-token';

      setToken(testToken);

      const state = useAuthStore.getState();
      expect(state.token).toBe(testToken);
    });

    it('should login correctly', () => {
      const { login } = useAuthStore.getState();
      const testToken = 'test-jwt-token';

      login(mockUser, testToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(testToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should logout correctly', () => {
      const { login, logout } = useAuthStore.getState();

      // First login
      login(mockUser, 'test-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state correctly', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    beforeEach(() => {
      useAuthStore.getState().login(mockUser, 'test-token');
    });

    it('should check permissions correctly', () => {
      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('READ_EMPLOYEES')).toBe(true);
      expect(hasPermission('DELETE_EMPLOYEES')).toBe(false);
    });

    it('should return false for permissions when user is not logged in', () => {
      useAuthStore.getState().logout();
      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('READ_EMPLOYEES')).toBe(false);
    });

    it('should check roles correctly', () => {
      const { hasRole } = useAuthStore.getState();

      expect(hasRole('HR_MANAGER')).toBe(true);
      expect(hasRole('ADMIN')).toBe(false);
    });

    it('should return false for roles when user is not logged in', () => {
      useAuthStore.getState().logout();
      const { hasRole } = useAuthStore.getState();

      expect(hasRole('HR_MANAGER')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no roles', () => {
      const userWithoutRoles: User = {
        ...mockUser,
        roles: [],
      };

      useAuthStore.getState().login(userWithoutRoles, 'test-token');
      const { hasPermission, hasRole } = useAuthStore.getState();

      expect(hasPermission('READ_EMPLOYEES')).toBe(false);
      expect(hasRole('HR_MANAGER')).toBe(false);
    });

    it('should handle role with no permissions', () => {
      const roleWithoutPermissions: Role = {
        id: 2,
        name: 'EMPTY_ROLE',
        permissions: [],
      };

      const userWithEmptyRole: User = {
        ...mockUser,
        roles: [roleWithoutPermissions],
      };

      useAuthStore.getState().login(userWithEmptyRole, 'test-token');
      const { hasPermission, hasRole } = useAuthStore.getState();

      expect(hasPermission('READ_EMPLOYEES')).toBe(false);
      expect(hasRole('EMPTY_ROLE')).toBe(true);
    });
  });
});
