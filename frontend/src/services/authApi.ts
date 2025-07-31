import { apiClient } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../types';

export const authApi = {
  // Authentication endpoints
  login: (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post('/api/auth/login', credentials);
  },

  register: (userData: RegisterRequest): Promise<User> => {
    return apiClient.post('/api/auth/register', userData);
  },

  logout: (): Promise<{ message: string }> => {
    return apiClient.post('/api/auth/logout');
  },

  refreshToken: (): Promise<AuthResponse> => {
    return apiClient.post('/api/auth/refresh');
  },

  // User profile endpoints (these would typically be in a separate user controller)
  getCurrentUser: (): Promise<User> => {
    return apiClient.get('/api/auth/me');
  },

  updateProfile: (userData: Partial<User>): Promise<User> => {
    return apiClient.put('/api/auth/profile', userData);
  },

  changePassword: (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    return apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  requestPasswordReset: (email: string): Promise<void> => {
    return apiClient.post('/api/auth/forgot-password', { email });
  },

  resetPassword: (token: string, newPassword: string): Promise<void> => {
    return apiClient.post('/api/auth/reset-password', {
      token,
      newPassword,
    });
  },

  verifyEmail: (token: string): Promise<void> => {
    return apiClient.post('/api/auth/verify-email', { token });
  },

  resendEmailVerification: (): Promise<void> => {
    return apiClient.post('/api/auth/resend-verification');
  },
};
