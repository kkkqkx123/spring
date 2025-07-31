import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { EmployeeList } from '../../features/employees/components/EmployeeList';
import { AppShell } from '../../components/layout/AppShell';

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

describe('Accessibility Tests', () => {
  it('LoginForm should not have accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <LoginForm onSubmit={vi.fn()} />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('EmployeeList should not have accessibility violations', async () => {
    // Mock the employee API
    vi.mock('../../services/employeeApi', () => ({
      employeeApi: {
        getAll: vi.fn().mockResolvedValue({
          content: [],
          totalElements: 0,
          totalPages: 0,
        }),
      },
    }));

    const { container } = render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AppShell should not have accessibility violations', async () => {
    const mockUser = {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      roles: [{ id: 1, name: 'USER', permissions: [] }],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock stores
    vi.mock('../../stores/authStore', () => ({
      useAuthStore: () => ({
        user: mockUser,
        isAuthenticated: true,
        logout: vi.fn(),
      }),
    }));

    vi.mock('../../stores/uiStore', () => ({
      useUIStore: () => ({
        sidebarOpen: true,
        toggleSidebar: vi.fn(),
        theme: 'light',
        toggleTheme: vi.fn(),
      }),
    }));

    const { container } = render(
      <TestWrapper>
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
