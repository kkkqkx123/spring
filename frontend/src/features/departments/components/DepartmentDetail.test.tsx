/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentDetail } from './DepartmentDetail';
import { type Department } from '../../../types';

// Mock the hooks
vi.mock('../hooks/useDepartmentTree');
vi.mock('./DepartmentForm', () => ({
  DepartmentForm: ({ onSuccess, onCancel }: any) => (
    <div data-testid="department-form">
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import * as departmentHooks from '../hooks/useDepartmentTree';

const mockDepartment: Department = {
  id: 1,
  name: 'Engineering',
  description: 'Software development team',
  employeeCount: 15,
  createdAt: '2024-01-01T00:00:00Z',
  children: [
    {
      id: 2,
      name: 'Frontend',
      description: 'Frontend development',
      parentId: 1,
      employeeCount: 8,
      createdAt: '2024-01-01T00:00:00Z',
      children: [],
    },
  ],
};

const mockEmployees = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: 'ACTIVE',
    position: { title: 'Senior Developer' },
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    status: 'ACTIVE',
    position: { title: 'Tech Lead' },
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentDetail', () => {
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useDepartment).mockReturnValue({
      data: mockDepartment,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(departmentHooks.useDepartmentEmployees).mockReturnValue({
      data: mockEmployees,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(departmentHooks.useDeleteDepartment).mockReturnValue({
      mutateAsync: mockDeleteMutate,
      isPending: false,
      error: null,
    } as any);
  });

  it('renders department details correctly', () => {
    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const heading = screen.getByRole('heading', {
      name: /engineering/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();

    // The description is a sibling of the heading's parent div
    const description = screen.getAllByText('Software development team');
    expect(description.length).toBeGreaterThan(0);

    expect(screen.getByText('15')).toBeInTheDocument(); // Employee count
    expect(screen.getByText('1')).toBeInTheDocument(); // Subdepartments count
  });

  it('shows loading state', () => {
    vi.mocked(departmentHooks.useDepartment).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(departmentHooks.useDepartment).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/failed to load department details/i)
    ).toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', async () => {
    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const editButton = screen.getByTestId('edit-action-button');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /edit department/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId('department-form')).toBeInTheDocument();
    });
  });

  it('calls onEdit callback when provided', () => {
    const mockOnEdit = vi.fn();
    render(<DepartmentDetail departmentId={1} onEdit={mockOnEdit} />, {
      wrapper: createWrapper(),
    });

    const editButton = screen.getByTestId('edit-action-button');
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('shows delete confirmation dialog', async () => {
    const emptyDepartment: Department = {
      ...mockDepartment,
      employeeCount: 0,
      children: [],
    };
    vi.mocked(departmentHooks.useDepartment).mockReturnValue({
      data: emptyDepartment,
      isLoading: false,
      error: null,
    } as any);

    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const deleteButton = screen.getByTestId('delete-action-button');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument();
    });
  });

  it('disables delete button for departments with employees', () => {
    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const deleteButton = screen.getByTestId('delete-action-button');
    expect(deleteButton).toBeDisabled();
  });

  it('switches between tabs correctly', async () => {
    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const employeesTab = screen.getByRole('tab', { name: /employees/i });
    fireEvent.click(employeesTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const subdepartmentsTab = screen.getByRole('tab', {
      name: /subdepartments/i,
    });
    fireEvent.click(subdepartmentsTab);

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });
  });

  it('shows empty state for employees when none exist', async () => {
    vi.mocked(departmentHooks.useDepartmentEmployees).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<DepartmentDetail departmentId={1} />, { wrapper: createWrapper() });

    const employeesTab = screen.getByRole('tab', { name: /employees/i });
    fireEvent.click(employeesTab);

    await waitFor(() => {
      expect(
        screen.getByText(/no employees in this department/i)
      ).toBeInTheDocument();
    });
  });

  it('calls onCreateChild when add subdepartment button is clicked', () => {
    const mockOnCreateChild = vi.fn();
    render(
      <DepartmentDetail departmentId={1} onCreateChild={mockOnCreateChild} />,
      { wrapper: createWrapper() }
    );

    const addButton = screen.getByRole('button', {
      name: /add subdepartment/i,
    });
    fireEvent.click(addButton);

    expect(mockOnCreateChild).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<DepartmentDetail departmentId={1} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deletes department successfully', async () => {
    const emptyDepartment: Department = {
      ...mockDepartment,
      employeeCount: 0,
      children: [],
    };
    vi.mocked(departmentHooks.useDepartment).mockReturnValue({
      data: emptyDepartment,
      isLoading: false,
      error: null,
    } as any);

    const mockOnDelete = vi.fn();
    mockDeleteMutate.mockResolvedValue({});

    render(<DepartmentDetail departmentId={1} onDelete={mockOnDelete} />, {
      wrapper: createWrapper(),
    });

    const deleteButton = screen.getByTestId('delete-action-button');
    fireEvent.click(deleteButton);

    await waitFor(async () => {
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith(1);
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });
});
