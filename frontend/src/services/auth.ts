import { apiClient } from './api';
import { webSocketService } from './websocket';
import { useAuthStore } from '../stores/authStore';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';
import {
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  type User,
} from '../types';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      useAuthStore.getState().setLoading(true);

      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials
      );

      // Store token in API client
      apiClient.setAuthToken(response.token);

      // Update auth store
      const user: User = {
        id: response.id,
        username: response.username,
        email: response.email,
        roles: [], // Will be populated by getCurrentUser
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useAuthStore.getState().login(user, response.token);

      // Get full user details
      await this.getCurrentUser();

      // Connect to WebSocket
      try {
        await webSocketService.connect();
      } catch (wsError) {
        console.warn('Failed to connect to WebSocket:', wsError);
        // Don't fail login if WebSocket connection fails
      }

      return response;
    } catch (error) {
      useAuthStore.getState().setLoading(false);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<User> {
    try {
      useAuthStore.getState().setLoading(true);

      const user = await apiClient.post<User>('/auth/register', userData);

      useAuthStore.getState().setLoading(false);
      return user;
    } catch (error) {
      useAuthStore.getState().setLoading(false);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local state
      this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh');

      // Update stored token
      apiClient.setAuthToken(response.token);
      useAuthStore.getState().setToken(response.token);

      return response.token;
    } catch (error) {
      // If refresh fails, logout user
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiClient.get<User>('/auth/me');

      // Update auth store with full user details
      useAuthStore.getState().setUser(user);

      return user;
    } catch (error) {
      // If getting user fails, logout
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await apiClient.put<User>('/auth/profile', userData);

      // Update auth store
      useAuthStore.getState().setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', { token });

      // Refresh user data to get updated verification status
      await this.getCurrentUser();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return useAuthStore.getState().user;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return useAuthStore.getState().token;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return useAuthStore.getState().hasPermission(permission);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return useAuthStore.getState().hasRole(role);
  }

  /**
   * Initialize authentication from stored data
   */
  async initialize(): Promise<void> {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      return;
    }

    try {
      useAuthStore.getState().setLoading(true);

      // Set token in API client
      apiClient.setAuthToken(token);

      // Verify token and get user data
      const user = await this.getCurrentUser();

      // Connect to WebSocket
      try {
        await webSocketService.connect();
      } catch (wsError) {
        console.warn(
          'Failed to connect to WebSocket during initialization:',
          wsError
        );
      }

      useAuthStore.getState().setLoading(false);
    } catch (error) {
      console.warn('Failed to initialize authentication:', error);
      this.clearAuthData();
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    // Clear API client token
    apiClient.clearAuthToken();

    // Disconnect WebSocket
    webSocketService.disconnect();

    // Clear auth store
    useAuthStore.getState().logout();

    // Clear storage
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);

    // Redirect to login if not already there
    if (
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      window.location.href = '/login';
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any): void {
    if (error.status === 401) {
      this.clearAuthData();
    }
  }

  /**
   * Get user permissions as array
   */
  getUserPermissions(): string[] {
    const user = this.getUser();
    if (!user) return [];

    const permissions: string[] = [];
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        if (!permissions.includes(permission.name)) {
          permissions.push(permission.name);
        }
      });
    });

    return permissions;
  }

  /**
   * Get user roles as array
   */
  getUserRoles(): string[] {
    const user = this.getUser();
    if (!user) return [];

    return user.roles.map(role => role.name);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }
}

// Create and export singleton instance
export const authService = AuthService.getInstance();

// Export default instance
export default authService;
