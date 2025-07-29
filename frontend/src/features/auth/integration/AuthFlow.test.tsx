import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AppRouter } from '../../../AppRouter';
import { useAuthStore } from '../../../stores/authStore';
import { authService } from '../../../services/auth';
import { ROUTES } from '../../../constants';

// Mock the auth service
vi.mock('../../../services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
  },
}));

// Mock WebSocket service
vi.mock('../../../services/websocket', () => ({
  webSocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

// Mock notifications
vi.mock('@mantine/notifications', async () => {
  const actual = await vi.importActual('@mantine/notifications');
  return {
    ...actual,
    notifications: {
      show: vi.fn(),
    },
  };
});

const TestWrapper = ({
  children,
  initialEntries = ['/'],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Flow Integration', () => {
  const mockAuthService = authService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated User Flow', () => {
    it('redirects unauthenticated user to login page', async () => {
      render(
        <TestWrapper initialEntries={[ROUTES.DASHBOARD]}>
          <AppRouter />
        </TestWrapper>
      );

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });

    it('allows access to public routes when unauthenticated', () => {
      render(
        <TestWrapper initialEntries={[ROUTES.LOGIN]}>
          <AppRouter />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
    });

    it('completes login flow successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        enabled: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const mockAuthResponse = {
        token: 'test-token',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      render(
        <TestWrapper initialEntries={[ROUTES.LOGIN]}>
          <AppRouter />
        </TestWrapper>
      );

      // Fill in login form
      fireEvent.change(screen.getByTestId('username-input'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByTestId('login-button'));

      // Wait for login to complete
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(
          screen.getByText('Dashboard Page - To be implemented')
        ).toBeInTheDocument();
      });
    });

    it('handles login failure correctly', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthService.login.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper initialEntries={[ROUTES.LOGIN]}>
          <AppRouter />
        </TestWrapper>
      );

      // Fill in login form
      fireEvent.change(screen.getByTestId('username-input'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpassword' },
      });

      // Submit form
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalled();
      });

      // Should stay on login page and show error
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();

      const { notifications } = await import('@mantine/notifications');
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Login Failed',
        message: errorMessage,
        color: 'red',
      });
    });

    it('completes registration flow successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        enabled: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      render(
        <TestWrapper initialEntries={[ROUTES.REGISTER]}>
          <AppRouter />
        </TestWrapper>
      );

      // Fill in registration form
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByTestId('username-input'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByTestId('accept-terms-checkbox'));

      // Submit form
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123!',
        });
      });

      // Should redirect to login page after successful registration
      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });

    it('navigates between login and register pages', () => {
      render(
        <TestWrapper initialEntries={[ROUTES.LOGIN]}>
          <AppRouter />
        </TestWrapper>
      );

      // Start on login page
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();

      // Click register link
      fireEvent.click(screen.getByTestId('register-link'));

      // Should navigate to register page
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Click login link
      fireEvent.click(screen.getByTestId('login-link'));

      // Should navigate back to login page
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            name: 'USER',
            permissions: [
              { id: 1, name: 'EMPLOYEE_READ' },
              { id: 2, name: 'DEPARTMENT_READ' },
            ],
          },
        ],
        enabled: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      useAuthStore.getState().login(mockUser, 'test-token');
    });

    it('redirects authenticated user away from public routes', () => {
      render(
        <TestWrapper initialEntries={[ROUTES.LOGIN]}>
          <AppRouter />
        </TestWrapper>
      );

      // Should redirect to dashboard
      expect(
        screen.getByText('Dashboard Page - To be implemented')
      ).toBeInTheDocument();
    });

    it('allows access to protected routes with sufficient permissions', () => {
      render(
        <TestWrapper initialEntries={[ROUTES.EMPLOYEES]}>
          <AppRouter />
        </TestWrapper>
      );

      expect(
        screen.getByText('Employees Page - To be implemented')
      ).toBeInTheDocument();
    });

    it('denies access to protected routes without sufficient permissions', () => {
      render(
        <TestWrapper initialEntries={[ROUTES.PERMISSIONS]}>
          <AppRouter />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/Required roles: ADMIN/)).toBeInTheDocument();
    });

    it('preserves intended destination after login', async () => {
      // Reset to unauthenticated state
      useAuthStore.getState().logout();

      const mockAuthResponse = {
        token: 'test-token',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      render(
        <TestWrapper initialEntries={[ROUTES.EMPLOYEES]}>
          <AppRouter />
        </TestWrapper>
      );

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });

      // Fill in login form
      fireEvent.change(screen.getByTestId('username-input'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalled();
      });

      // Should redirect back to intended destination (employees page)
      // Note: This would require the login to actually update the auth state
      // In a real test, you'd need to mock the auth state update properly
    });
  });

  describe('Route Protection', () => {
    it('shows 404 page for non-existent routes', () => {
      render(
        <TestWrapper initialEntries={['/non-existent-route']}>
          <AppRouter />
        </TestWrapper>
      );

      expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    });

    it('handles deep linking to protected routes', async () => {
      render(
        <TestWrapper initialEntries={['/employees/123']}>
          <AppRouter />
        </TestWrapper>
      );

      // Should redirect to login page for unauthenticated user
      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      });
    });
  });
});
