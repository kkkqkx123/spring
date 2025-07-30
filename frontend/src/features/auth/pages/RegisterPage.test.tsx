/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { useRegister } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants';

// Mock the useRegister hook
vi.mock('../../../hooks/useAuth', () => ({
  useRegister: vi.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
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

describe('RegisterPage', () => {
  const mockMutateAsync = vi.fn();
  const mockUseRegister = useRegister as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRegister.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });
  });

  it('renders register form', () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('accept-terms-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    mockMutateAsync.mockResolvedValue({ id: 1, ...userData });

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    // Fill in the form
    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: userData.firstName },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: userData.lastName },
    });
    fireEvent.change(screen.getByTestId('username-input'), {
      target: { value: userData.username },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: userData.email },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: userData.password },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: userData.password },
    });
    fireEvent.click(screen.getByTestId('accept-terms-checkbox'));

    // Submit the form
    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(userData);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN);
    });
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Username already exists';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    // Fill in the form with valid data
    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByTestId('username-input'), {
      target: { value: 'existinguser' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByTestId('accept-terms-checkbox'));

    // Submit the form
    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Error should be handled by notifications
    const { notifications } = await import('@mantine/notifications');
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Registration Failed',
        message: errorMessage,
        color: 'red',
      });
    });
  });

  it('navigates to login page when login link is clicked', () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('login-link'));

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  it('shows loading state during registration', () => {
    mockUseRegister.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      error: null,
    });

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    expect(screen.getByTestId('register-button')).toBeDisabled();
    expect(screen.getByTestId('first-name-input')).toBeDisabled();
    expect(screen.getByTestId('last-name-input')).toBeDisabled();
    expect(screen.getByTestId('username-input')).toBeDisabled();
    expect(screen.getByTestId('email-input')).toBeDisabled();
    expect(screen.getByTestId('password-input')).toBeDisabled();
    expect(screen.getByTestId('confirm-password-input')).toBeDisabled();
    expect(screen.getByTestId('accept-terms-checkbox')).toBeDisabled();
  });

  it('displays error from hook', () => {
    const errorMessage = 'Network error';
    mockUseRegister.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: { message: errorMessage },
    });

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    expect(screen.getByText('Registration Failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
