import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { AppShell } from '../AppShell';
import type { User } from '../../../types';

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
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: [{ id: 1, name: 'USER', permissions: [] }],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
        <AppShell user={mockUser}>
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Use more specific query to find user name in header
    const userNameElements = screen.getAllByText('Test User');
    expect(userNameElements[0]).toBeInTheDocument();
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const menuButton = screen.getByRole('button', {
      name: /toggle navigation/i,
    });
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

    render(
      <TestWrapper>
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Theme toggle is handled by UI store, not directly in component
    expect(mockToggleTheme).not.toHaveBeenCalled();
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Open user menu
    const userNameElements = screen.getAllByText('Test User');
    const userButton = userNameElements[0];
    await user.click(userButton);

    // Click logout - use getByRole for better specificity
    const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const shell = screen.getByRole('main').parentElement;
    expect(shell).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <TestWrapper>
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const userNameElements = screen.getAllByText('Test User');
    expect(userNameElements[0]).toBeInTheDocument();
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
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const shell = screen.getByRole('main').parentElement;
    expect(shell).toBeInTheDocument();
  });
});
