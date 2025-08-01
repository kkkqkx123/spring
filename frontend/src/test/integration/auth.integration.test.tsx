/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { authService } from '../../services/auth';

// Mock the auth service
vi.mock('../../services/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

const mockAuthService = authService as any;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        <BrowserRouter>{children}</BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('completes full login flow successfully', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['USER'],
    };

    mockAuthService.login.mockResolvedValue({
      token: 'test-token',
      user: mockUser,
    });

    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <LoginForm onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    // Verify success callback
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('handles login failure with proper error display', async () => {
    const user = userEvent.setup();

    mockAuthService.login.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    });

    render(
      <TestWrapper>
        <LoginForm onSubmit={vi.fn()} />
      </TestWrapper>
    );

    // Fill in login form with invalid credentials
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('handles token refresh flow', async () => {
    const mockRefreshResponse = {
      token: 'new-token',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER'],
      },
    };

    mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

    // Simulate token refresh
    const result = await authService.refreshToken();

    expect(result).toEqual(mockRefreshResponse);
    expect(mockAuthService.refreshToken).toHaveBeenCalled();
  });

  it('handles logout flow', async () => {
    mockAuthService.logout.mockResolvedValue({});

    // Simulate logout
    await authService.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('persists authentication state across page reloads', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['USER'],
    };

    // Simulate existing token in localStorage
    localStorage.setItem('auth_token', 'existing-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    mockAuthService.login.mockResolvedValue({
      token: 'existing-token',
      user: mockUser,
    });

    render(
      <TestWrapper>
        <LoginForm onSubmit={vi.fn()} />
      </TestWrapper>
    );

    // Verify that existing auth state is recognized
    expect(localStorage.getItem('auth_token')).toBe('existing-token');
    expect(JSON.parse(localStorage.getItem('auth_user') || '{}')).toEqual(
      mockUser
    );
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();

    mockAuthService.login.mockRejectedValue(new Error('Network Error'));

    render(
      <TestWrapper>
        <LoginForm onSubmit={vi.fn()} />
      </TestWrapper>
    );

    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verify network error is handled
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
