import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { useLogin } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants';

// Mock the useLogin hook
vi.mock('../../../hooks/useAuth', () => ({
  useLogin: vi.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockLocation = { state: null as any };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
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

describe('LoginPage', () => {
  const mockMutateAsync = vi.fn();
  const mockUseLogin = useLogin as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });
  });

  it('renders login form', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockMutateAsync.mockResolvedValue({ token: 'test-token' });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Fill in the form
    fireEvent.change(screen.getByTestId('username-input'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.DASHBOARD, {
        replace: true,
      });
    });
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Fill in the form
    fireEvent.change(screen.getByTestId('username-input'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Error should be handled by notifications
    const { notifications } = await import('@mantine/notifications');
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Login Failed',
        message: errorMessage,
        color: 'red',
      });
    });
  });

  it('navigates to register page when register link is clicked', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('register-link'));

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.REGISTER);
  });

  it('shows loading state during login', () => {
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      error: null,
    });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    expect(screen.getByTestId('login-button')).toBeDisabled();
  });

  it('redirects to intended destination after login', async () => {
    const intendedPath = '/employees';
    mockLocation.state = { from: { pathname: intendedPath } };
    mockMutateAsync.mockResolvedValue({ token: 'test-token' });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Fill in and submit form
    fireEvent.change(screen.getByTestId('username-input'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(intendedPath, {
        replace: true,
      });
    });
  });

  it('handles forgot password click', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('forgot-password-link'));

    const { notifications } = await import('@mantine/notifications');
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith({
        title: 'Feature Coming Soon',
        message: 'Password reset functionality will be available soon.',
        color: 'blue',
      });
    });
  });
});
