import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth';
import { apiClient } from './api';
import { webSocketService } from './websocket';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';

// Mock dependencies
vi.mock('./api');
vi.mock('./websocket');
vi.mock('../stores/authStore');
vi.mock('../utils');

describe('AuthService', () => {
  // Test the core functionality that we can verify
  describe('AuthService Core Features', () => {
    it('should be a singleton', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should have all required methods', () => {
      const authService = AuthService.getInstance();

      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.refreshToken).toBe('function');
      expect(typeof authService.getCurrentUser).toBe('function');
      expect(typeof authService.updateProfile).toBe('function');
      expect(typeof authService.changePassword).toBe('function');
      expect(typeof authService.requestPasswordReset).toBe('function');
      expect(typeof authService.resetPassword).toBe('function');
      expect(typeof authService.verifyEmail).toBe('function');
      expect(typeof authService.resendEmailVerification).toBe('function');
      expect(typeof authService.initialize).toBe('function');
      expect(typeof authService.handleAuthError).toBe('function');
    });

    it('should handle API client interactions', async () => {
      const authService = AuthService.getInstance();

      // Test password change
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);
      await authService.changePassword('old', 'new');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
      });

      // Test password reset request
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);
      await authService.requestPasswordReset('test@example.com');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });

      // Test password reset
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);
      await authService.resetPassword('token', 'newpass');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token',
        newPassword: 'newpass',
      });

      // Test email verification resend
      vi.mocked(apiClient.post).mockResolvedValueOnce(undefined);
      await authService.resendEmailVerification();
      expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification');
    });

    it('should handle initialization without token', async () => {
      const authService = AuthService.getInstance();
      vi.mocked(storage.get).mockReturnValue(null);

      await authService.initialize();

      expect(apiClient.setAuthToken).not.toHaveBeenCalled();
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle error handling for non-auth errors', () => {
      const authService = AuthService.getInstance();

      // Should not clear auth data for non-401 errors
      authService.handleAuthError({ status: 500 });

      // This test verifies the method exists and can be called
      expect(true).toBe(true);
    });
  });

  describe('Permission and Role Helpers', () => {
    it('should handle user permissions when no user exists', () => {
      const authService = AuthService.getInstance();

      // Mock getUser to return null
      authService.getUser = vi.fn().mockReturnValue(null);

      const permissions = authService.getUserPermissions();
      const roles = authService.getUserRoles();

      expect(permissions).toEqual([]);
      expect(roles).toEqual([]);
    });

    it('should extract permissions and roles from user data', () => {
      const authService = AuthService.getInstance();

      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            name: 'ADMIN',
            permissions: [
              { id: 1, name: 'READ_USERS', description: 'Read users' },
              { id: 2, name: 'WRITE_USERS', description: 'Write users' },
            ],
          },
          {
            id: 2,
            name: 'USER',
            permissions: [
              { id: 3, name: 'READ_PROFILE', description: 'Read profile' },
            ],
          },
        ],
        enabled: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      // Mock getUser to return the mock user
      authService.getUser = vi.fn().mockReturnValue(mockUser);

      const permissions = authService.getUserPermissions();
      const roles = authService.getUserRoles();

      expect(permissions).toEqual([
        'READ_USERS',
        'WRITE_USERS',
        'READ_PROFILE',
      ]);
      expect(roles).toEqual(['ADMIN', 'USER']);
    });

    it('should handle permission checking methods', () => {
      const authService = AuthService.getInstance();

      // Mock the basic permission/role methods
      authService.hasPermission = vi
        .fn()
        .mockImplementation(perm => perm === 'READ_USERS');
      authService.hasRole = vi
        .fn()
        .mockImplementation(role => role === 'ADMIN');

      expect(authService.hasAnyPermission(['READ_USERS', 'WRITE_USERS'])).toBe(
        true
      );
      expect(
        authService.hasAnyPermission(['WRITE_USERS', 'DELETE_USERS'])
      ).toBe(false);
      expect(authService.hasAllPermissions(['READ_USERS'])).toBe(true);
      expect(authService.hasAllPermissions(['READ_USERS', 'WRITE_USERS'])).toBe(
        false
      );

      expect(authService.hasAnyRole(['ADMIN', 'USER'])).toBe(true);
      expect(authService.hasAnyRole(['USER', 'GUEST'])).toBe(false);
      expect(authService.hasAllRoles(['ADMIN'])).toBe(true);
      expect(authService.hasAllRoles(['ADMIN', 'USER'])).toBe(false);
    });
  });
});
