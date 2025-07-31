import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { EmployeeList } from '../../features/employees/components/EmployeeList';
import { AppShell } from '../../components/layout/AppShell';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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
        <LoginForm onSuccess={vi.fn()} />
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
    // Mock stores
    vi.mock('../../stores/authStore', () => ({
      useAuthStore: () => ({
        user: { id: 1, username: 'test', roles: ['USER'] },
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
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
