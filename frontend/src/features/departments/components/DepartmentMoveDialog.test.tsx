import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentMoveDialog } from './DepartmentMoveDialog';
import { Department } from '../../../types';

// Mock the hooks
vi.mock('../hooks/useDepartmentTree');
vi.mock('./DepartmentSelect', () => ({
  DepartmentSelect: ({ label, ...props }: any) => (
    <select data-testid="department-select" {...props}>
      <option value="">Move to Root Level</option>
      <option value="1">Engineering</option>
      <option value="2">Marketing</option>
      <option value="3">Sales</option>
    </select>
  ),
}));

import * as departmentHooks from '../hooks/useDepartmentTree';

const mockDepartment: Department = {
  id: 1,
  name: 'Frontend',
  description: 'Frontend development team',
  parentId: 2,
  employeeCount: 8,
  createdAt: '2024-01-01T00:00:00Z',
  children: [],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentMoveDialog', () => {
  const mockMoveMutate = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useMoveDepartment).mockReturnValue({
      mutateAsync: mockMoveMutate,
      isPending: false,
      error: null,
    } as any);
  });

  it('renders dialog correctly when opened', () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Move Department')).toBeInTheDocument();
    expect(screen.getByText(/moving department: frontend/i)).toBeInTheDocument();
    expect(screen.getByTestId('department-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move department/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DepartmentMoveDialog
        opened={false}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Move Department')).not.toBeInTheDocument();
  });

  it('shows current parent information', () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Current Location')).toBeInTheDocument();
    expect(screen.getByText('Department ID: 2')).toBeInTheDocument();
  });

  it('shows root level for departments without parent', () => {
    const rootDepartment = { ...mockDepartment, parentId: undefined };
    
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={rootDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Root Level')).toBeInTheDocument();
  });

  it('submits move request with new parent', async () => {
    mockMoveMutate.mockResolvedValue({});

    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Change parent department
    const select = screen.getByTestId('department-select');
    fireEvent.change(select, { target: { value: '3' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /move department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMoveMutate).toHaveBeenCalledWith({
        departmentId: 1,
        newParentId: 3,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits move request to root level', async () => {
    mockMoveMutate.mockResolvedValue({});

    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Change to root level
    const select = screen.getByTestId('department-select');
    fireEvent.change(select, { target: { value: '' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /move department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMoveMutate).toHaveBeenCalledWith({
        departmentId: 1,
        newParentId: undefined,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables submit button when no change is made', () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /move department/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', () => {
    vi.mocked(departmentHooks.useMoveDepartment).mockReturnValue({
      mutateAsync: mockMoveMutate,
      isPending: true,
      error: null,
    } as any);

    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /move department/i });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });

  it('shows error message on submission error', () => {
    const error = {
      response: {
        data: {
          message: 'Cannot move department to its own child',
        },
      },
    };

    vi.mocked(departmentHooks.useMoveDepartment).mockReturnValue({
      mutateAsync: mockMoveMutate,
      isPending: false,
      error,
    } as any);

    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/cannot move department to its own child/i)).toBeInTheDocument();
  });

  it('shows warning for departments with children', () => {
    const departmentWithChildren = {
      ...mockDepartment,
      children: [
        { id: 3, name: 'Child 1' },
        { id: 4, name: 'Child 2' },
      ],
    };

    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={departmentWithChildren}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/this department has 2 subdepartment/i)).toBeInTheDocument();
    expect(screen.getByText(/moving this department will also move all its subdepartments/i)).toBeInTheDocument();
  });

  it('shows warning for departments with employees', () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/this department has 8 employee/i)).toBeInTheDocument();
    expect(screen.getByText(/they will remain in this department after the move/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows preview of the move when selection changes', async () => {
    render(
      <DepartmentMoveDialog
        opened={true}
        onClose={mockOnClose}
        department={mockDepartment}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Change parent department
    const select = screen.getByTestId('department-select');
    fireEvent.change(select, { target: { value: '3' } });

    await waitFor(() => {
      expect(screen.getByText('Department ID: 2')).toBeInTheDocument(); // Current
      expect(screen.getByText('Department ID: 3')).toBeInTheDocument(); // New
    });
  });
});