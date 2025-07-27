import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { queryKeys } from '../services/queryKeys';
import {
  type LoginRequest,
  type RegisterRequest,
  type User,
  type ApiError,
} from '../types';

// Hook for authentication state
export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, hasPermission, hasRole } =
    useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasRole,
    // Additional helper methods
    getUserPermissions: useCallback(() => authService.getUserPermissions(), []),
    getUserRoles: useCallback(() => authService.getUserRoles(), []),
    hasAnyPermission: useCallback(
      (permissions: string[]) => authService.hasAnyPermission(permissions),
      []
    ),
    hasAllPermissions: useCallback(
      (permissions: string[]) => authService.hasAllPermissions(permissions),
      []
    ),
    hasAnyRole: useCallback(
      (roles: string[]) => authService.hasAnyRole(roles),
      []
    ),
    hasAllRoles: useCallback(
      (roles: string[]) => authService.hasAllRoles(roles),
      []
    ),
  };
};

// Hook for login functionality
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: data => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      queryClient.setQueryData(queryKeys.auth.user, data);
    },
    onError: (error: ApiError) => {
      authService.handleAuthError(error);
    },
  });
};

// Hook for registration functionality
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onError: (error: ApiError) => {
      console.error('Registration failed:', error);
    },
  });
};

// Hook for logout functionality
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
    onError: error => {
      console.error('Logout failed:', error);
      // Still clear auth data even if API call fails
      authService.handleAuthError({ status: 401 });
    },
  });
};

// Hook for getting current user
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: ApiError) => {
      // Don't retry on auth errors
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook for updating user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      authService.updateProfile(userData),
    onSuccess: updatedUser => {
      // Update cached user data
      queryClient.setQueryData(queryKeys.auth.user, updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
    onError: (error: ApiError) => {
      authService.handleAuthError(error);
    },
  });
};

// Hook for changing password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
    onError: (error: ApiError) => {
      authService.handleAuthError(error);
    },
  });
};

// Hook for password reset request
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
};

// Hook for password reset
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => authService.resetPassword(token, newPassword),
  });
};

// Hook for email verification
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      // Refresh user data to get updated verification status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
    onError: (error: ApiError) => {
      authService.handleAuthError(error);
    },
  });
};

// Hook for resending email verification
export const useResendEmailVerification = () => {
  return useMutation({
    mutationFn: () => authService.resendEmailVerification(),
    onError: (error: ApiError) => {
      authService.handleAuthError(error);
    },
  });
};

// Hook for authentication initialization
export const useAuthInitialization = () => {
  return useQuery({
    queryKey: ['auth', 'initialize'],
    queryFn: async () => {
      await authService.initialize();
      return true;
    },
    staleTime: Infinity, // Only run once
    retry: false,
  });
};

// Hook for permission-based rendering
export const usePermission = (permission: string) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Hook for role-based rendering
export const useRole = (role: string) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

// Hook for multiple permissions check
export const usePermissions = (permissions: string[], requireAll = false) => {
  const auth = useAuth();

  return useCallback(() => {
    if (requireAll) {
      return auth.hasAllPermissions(permissions);
    }
    return auth.hasAnyPermission(permissions);
  }, [permissions, requireAll, auth]);
};

// Hook for multiple roles check
export const useRoles = (roles: string[], requireAll = false) => {
  const auth = useAuth();

  return useCallback(() => {
    if (requireAll) {
      return auth.hasAllRoles(roles);
    }
    return auth.hasAnyRole(roles);
  }, [roles, requireAll, auth]);
};

// Hook for authentication status monitoring
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isLoggedIn: isAuthenticated && !!user,
    isGuest: !isAuthenticated,
    userId: user?.id,
    username: user?.username,
    email: user?.email,
  };
};
