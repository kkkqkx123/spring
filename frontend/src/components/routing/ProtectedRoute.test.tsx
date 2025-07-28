import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: any }) => (
      <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
        Navigate to {to}
      </div>
    ),
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </MantineProvider>
);

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth as any;
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', ROUTES.LOGIN);
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated and has no role/permission requirements', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('shows access denied when user lacks required role', () => {
    const mockHasRole = vi.fn().mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: mockHasRole,
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/Required roles: ADMIN/)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockHasRole).toHaveBeenCalledWith('ADMIN');
  });

  it('shows access denied when user lacks required permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: vi.fn(),
      hasPermission: mockHasPermission,
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredPermission="EMPLOYEE_READ">
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/Required permissions: EMPLOYEE_READ/)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('EMPLOYEE_READ');
  });

  it('renders children when user has required role', () => {
    const mockHasRole = vi.fn().mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: mockHasRole,
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    expect(mockHasRole).toHaveBeenCalledWith('ADMIN');
  });

  it('renders children when user has required permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: vi.fn(),
      hasPermission: mockHasPermission,
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredPermission="EMPLOYEE_READ">
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('EMPLOYEE_READ');
  });

  it('handles multiple roles with requireAll=false (OR logic)', () => {
    const mockHasRole = vi.fn()
      .mockReturnValueOnce(false) // First role check fails
      .mockReturnValueOnce(true);  // Second role check passes

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: mockHasRole,
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']} requireAll={false}>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockHasRole).toHaveBeenCalledWith('ADMIN');
    expect(mockHasRole).toHaveBeenCalledWith('MANAGER');
  });

  it('handles multiple roles with requireAll=true (AND logic)', () => {
    const mockHasRole = vi.fn()
      .mockReturnValueOnce(true)  // First role check passes
      .mockReturnValueOnce(false); // Second role check fails

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: mockHasRole,
      hasPermission: vi.fn(),
    });

    render(
      <TestWrapper>
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']} requireAll={true}>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/Required roles: ADMIN AND MANAGER/)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders custom fallback when access is denied', () => {
    const mockHasRole = vi.fn().mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: mockHasRole,
      hasPermission: vi.fn(),
    });

    const CustomFallback = () => <div data-testid="custom-fallback">Custom Access Denied</div>;

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="ADMIN" fallback={<CustomFallback />}>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});