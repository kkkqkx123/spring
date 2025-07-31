import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { AppShell } from '../AppShell';

// Mock the auth store
const mockUseAuthStore = vi.fn();
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Mock the UI store
const mockUseUIStore = vi.fn();
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: () => mockUseUIStore(),
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
        <BrowserRouter>{children}</BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('AppShell', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['USER'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    mockUseUIStore.mockReturnValue({
      sidebarOpen: true,
      toggleSidebar: vi.fn(),
      theme: 'light',
      toggleTheme: vi.fn(),
    });
  });

  it('renders app shell with navigation', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows user information in header', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('handles sidebar toggle', async () => {
    const mockToggleSidebar = vi.fn();
    mockUseUIStore.mockReturnValue({
      sidebarOpen: true,
      toggleSidebar: mockToggleSidebar,
      theme: 'light',
      toggleTheme: vi.fn(),
    });

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const menuButton = screen.getByLabelText('Toggle navigation');
    await user.click(menuButton);

    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('handles theme toggle', async () => {
    const mockToggleTheme = vi.fn();
    mockUseUIStore.mockReturnValue({
      sidebarOpen: true,
      toggleSidebar: vi.fn(),
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const themeButton = screen.getByLabelText('Toggle theme');
    await user.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('handles user logout', async () => {
    const mockLogout = vi.fn();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Open user menu
    const userButton = screen.getByText('testuser');
    await user.click(userButton);

    // Click logout
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows collapsed sidebar when closed', () => {
    mockUseUIStore.mockReturnValue({
      sidebarOpen: false,
      toggleSidebar: vi.fn(),
      theme: 'light',
      toggleTheme: vi.fn(),
    });

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveClass('collapsed');
  });

  it('applies dark theme class', () => {
    mockUseUIStore.mockReturnValue({
      sidebarOpen: true,
      toggleSidebar: vi.fn(),
      theme: 'dark',
      toggleTheme: vi.fn(),
    });

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const shell = screen.getByRole('main').parentElement;
    expect(shell).toHaveClass('dark-theme');
  });

  it('renders breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Employees', href: '/employees' },
      { label: 'John Doe' },
    ];

    render(
      <TestWrapper>
        <AppShell breadcrumbs={breadcrumbs}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles responsive behavior on mobile', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const shell = screen.getByRole('main').parentElement;
    expect(shell).toHaveClass('mobile');
  });
});
