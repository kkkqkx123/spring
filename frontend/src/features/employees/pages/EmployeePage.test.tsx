import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeePage } from './EmployeePage';
import {
  type Employee,
  type Department,
  type Position,
  type User,
  type Role,
} from '../../../types';
import * as employeeHooks from '../hooks/useEmployees';
import * as authHooks from '../../../hooks/useAuth';

// Mock the hooks
vi.mock('../hooks/useEmployees');
vi.mock('../../../hooks/useAuth');
vi.mock('@mantine/notifications');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const mockDepartment: Department = {
  id: 1,
  name: 'Engineering',
  description: 'Software development team',
  employeeCount: 10,
  createdAt: '2023-01-01T00:00:00Z',
};

const mockPosition: Position = {
  id: 1,
  title: 'Software Engineer',
  description: 'Develops software applications',
  departmentId: 1,
};

const mockEmployee: Employee = {
  id: 1,
  employeeNumber: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  department: mockDepartment,
  position: mockPosition,
  hireDate: '2023-01-15',
  salary: 75000,
  status: 'ACTIVE',
  profilePicture: '',
};

const mockAdminRole: Role = {
  id: 1,
  name: 'ADMIN',
  permissions: [],
};

const mockHRRole: Role = {
  id: 2,
  name: 'HR_MANAGER',
  permissions: [],
};

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: [mockAdminRole],
  enabled: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockHRUser: User = {
  id: 2,
  username: 'hr',
  email: 'hr@example.com',
  firstName: 'HR',
  lastName: 'Manager',
  roles: [mockHRRole],
  enabled: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const createWrapper = (initialEntries = ['/employees/1']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('EmployeePage', () => {
  const mockCreateEmployee = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockUpdateEmployee = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockDeleteEmployee = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock employee hooks
    (employeeHooks.useEmployee as any).mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      error: null,
    });

    (employeeHooks.useCreateEmployee as any).mockReturnValue(
      mockCreateEmployee
    );
    (employeeHooks.useUpdateEmployee as any).mockReturnValue(
      mockUpdateEmployee
    );
    (employeeHooks.useDeleteEmployee as any).mockReturnValue(
      mockDeleteEmployee
    );

    // Mock auth hook
    (authHooks.useAuth as any).mockReturnValue({
      user: mockAdminUser,
    });

    // Mock notifications
    (notifications.show as any).mockImplementation(() => {});
  });

  it('renders employee detail view by default', () => {
    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Employee Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Employee #EMP001')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for admin user', () => {
    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('button', { name: /edit employee/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete employee/i })
    ).toBeInTheDocument();
  });

  it('shows only edit button for HR manager', () => {
    (authHooks.useAuth as any).mockReturnValue({
      user: mockHRUser,
    });

    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('button', { name: /edit employee/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete employee/i })
    ).not.toBeInTheDocument();
  });

  it('switches to edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(<EmployeePage />, { wrapper: createWrapper() });

    const editButton = screen.getByTestId('edit-employee-button');
    await user.click(editButton);

    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
  });

  it('shows delete confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(<EmployeePage />, { wrapper: createWrapper() });

    const deleteButton = screen.getByTestId('delete-employee-button');
    await user.click(deleteButton);

    expect(await screen.findByText('Confirm Deletion')).toBeInTheDocument();
    expect(
      await screen.findByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText(/john.*doe/i)).toBeInTheDocument();
  });

  it('handles employee update successfully', async () => {
    const user = userEvent.setup();
    mockUpdateEmployee.mutateAsync.mockResolvedValue(mockEmployee);

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Switch to edit mode
    const editButton = screen.getByRole('button', { name: /edit employee/i });
    await user.click(editButton);

    // Submit form (assuming form is valid)
    const updateButton = screen.getByRole('button', {
      name: /update employee/i,
    });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateEmployee.mutateAsync).toHaveBeenCalled();
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          message: 'Employee updated successfully',
          color: 'green',
        })
      );
    });
  });

  it('handles employee deletion successfully', async () => {
    const user = userEvent.setup();
    mockDeleteEmployee.mutateAsync.mockResolvedValue(undefined);

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Open delete modal
    const deleteButton = screen.getByTestId('delete-employee-button');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = await screen.findByTestId('confirm-delete-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteEmployee.mutateAsync).toHaveBeenCalledWith(1);
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          message: 'Employee deleted successfully',
          color: 'green',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/employees');
    });
  });

  it('handles update error', async () => {
    const user = userEvent.setup();
    mockUpdateEmployee.mutateAsync.mockRejectedValue(
      new Error('Update failed')
    );

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Switch to edit mode
    const editButton = screen.getByRole('button', { name: /edit employee/i });
    await user.click(editButton);

    // Submit form
    const updateButton = screen.getByRole('button', {
      name: /update employee/i,
    });
    await user.click(updateButton);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          message: 'Failed to update employee',
          color: 'red',
        })
      );
    });
  });

  it('handles delete error', async () => {
    const user = userEvent.setup();
    mockDeleteEmployee.mutateAsync.mockRejectedValue(
      new Error('Delete failed')
    );

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Open delete modal
    const deleteButton = screen.getByRole('button', {
      name: /delete employee/i,
    });
    await user.click(deleteButton);

    // Confirm deletion in modal
    const modal = await screen.findByRole('dialog');
    const confirmButton = within(modal).getByRole('button', {
      name: /delete employee/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          message: 'Failed to delete employee',
          color: 'red',
        })
      );
    });
  });

  it('navigates back to employees list when back button is clicked', async () => {
    const user = userEvent.setup();

    render(<EmployeePage />, { wrapper: createWrapper() });

    const backButton = screen.getByRole('button', {
      name: /back to employees/i,
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/employees');
  });

  it('shows loading state when employee is loading', () => {
    (employeeHooks.useEmployee as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when employee fails to load', () => {
    (employeeHooks.useEmployee as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load employee' },
    });

    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Error loading employee')).toBeInTheDocument();
    expect(screen.getByText('Failed to load employee')).toBeInTheDocument();
  });

  it('shows not found message when employee does not exist', () => {
    (employeeHooks.useEmployee as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<EmployeePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Employee not found')).toBeInTheDocument();
    expect(
      screen.getByText('The requested employee could not be found.')
    ).toBeInTheDocument();
  });

  it('cancels edit mode and returns to view mode', async () => {
    const user = userEvent.setup();

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Switch to edit mode
    const editButton = screen.getByRole('button', { name: /edit employee/i });
    await user.click(editButton);

    expect(screen.getByText('Edit Employee')).toBeInTheDocument();

    // Cancel edit
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.getByText('Employee Details')).toBeInTheDocument();
  });

  it('closes delete modal when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(<EmployeePage />, { wrapper: createWrapper() });

    // Open delete modal
    const deleteButton = screen.getByRole('button', {
      name: /delete employee/i,
    });
    await user.click(deleteButton);

    expect(await screen.findByText('Confirm Deletion')).toBeInTheDocument();

    // Cancel deletion
    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });
  });
});
