import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Navigation } from './Navigation';
import { User } from '../../types';

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [{ id: 1, name: 'USER', permissions: [] }],
  enabled: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const adminUser: User = {
  ...mockUser,
  roles: [{ id: 1, name: 'ADMIN', permissions: [] }],
};

const hrManagerUser: User = {
  ...mockUser,
  roles: [{ id: 2, name: 'HR_MANAGER', permissions: [] }],
};

const renderWithProviders = (
  component: React.ReactElement,
  initialRoute = '/'
) => {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialRoute]}>{component}</MemoryRouter>
    </MantineProvider>
  );
};

describe('Navigation', () => {
  it('renders user information', () => {
    renderWithProviders(<Navigation user={mockUser} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('renders username when first/last name not available', () => {
    const userWithoutName = {
      ...mockUser,
      firstName: undefined,
      lastName: undefined,
    };
    renderWithProviders(<Navigation user={userWithoutName} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders basic navigation items for regular user', () => {
    renderWithProviders(<Navigation user={mockUser} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('does not show admin-only items for regular user', () => {
    renderWithProviders(<Navigation user={mockUser} />);

    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    expect(screen.queryByText('Departments')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
  });

  it('shows HR manager items for HR manager user', () => {
    renderWithProviders(<Navigation user={hrManagerUser} />);

    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Permissions')).not.toBeInTheDocument(); // Admin only
  });

  it('shows all items for admin user', () => {
    renderWithProviders(<Navigation user={adminUser} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    renderWithProviders(<Navigation user={mockUser} />, '/dashboard');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('data-active', 'true');
  });

  it('calls onNavigate when navigation item is clicked', async () => {
    const user = userEvent.setup();
    const mockOnNavigate = vi.fn();

    renderWithProviders(
      <Navigation user={mockUser} onNavigate={mockOnNavigate} />
    );

    await user.click(screen.getByText('Dashboard'));
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('handles logout click', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithProviders(<Navigation user={mockUser} />);

    await user.click(screen.getByText('Logout'));
    expect(consoleSpy).toHaveBeenCalledWith('Logout clicked');

    consoleSpy.mockRestore();
  });

  it('renders correct navigation links', () => {
    renderWithProviders(<Navigation user={adminUser} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const employeesLink = screen.getByText('Employees').closest('a');
    expect(employeesLink).toHaveAttribute('href', '/employees');
  });
});
