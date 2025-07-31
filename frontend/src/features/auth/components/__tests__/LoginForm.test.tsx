import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { LoginForm } from '../LoginForm';

// Mock the auth hooks
const mockUseLogin = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useLogin: () => mockUseLogin(),
}));

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
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('renders login form', () => {
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      token: 'test-token',
      user: { id: 1, username: 'testuser' },
    });

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    });

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: true,
      error: { message: 'Invalid credentials' },
    });

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows remember me checkbox', () => {
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('shows forgot password link', () => {
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('handles form reset', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');

    // Simulate form reset (could be triggered by parent component)
    fireEvent.reset(screen.getByRole('form'));

    expect(usernameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  it('validates username format', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'a'); // Too short
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(
        screen.getByText(/username must be at least 3 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('validates password format', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, '123'); // Too short
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });
});
