import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PublicRoute } from './PublicRoute';
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
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to}>
        Navigate to {to}
      </div>
    ),
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </MantineProvider>
);

describe('PublicRoute', () => {
  const mockUseAuth = useAuth as any;
  const TestComponent = () => (
    <div data-testid="public-content">Public Content</div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <TestWrapper>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('renders children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      ROUTES.DASHBOARD
    );
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('redirects to custom route when specified', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const customRedirect = '/custom-page';

    render(
      <TestWrapper>
        <PublicRoute redirectTo={customRedirect}>
          <TestComponent />
        </PublicRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      customRedirect
    );
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });
});
