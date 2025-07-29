import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentForm } from './DepartmentForm';
import { Department } from '../../../types';

// Mock the hooks
vi.mock('../hooks/useDepartmentTree');
vi.mock('./DepartmentSelect', () => ({
  DepartmentSelect: ({ label, ...props }: any) => (
    <select data-testid="department-select" {...props}>
      <option value="">No Parent Department</option>
      <option value="1">Engineering</option>
      <option value="2">Marketing</option>
    </select>
  ),
}));

import * as departmentHooks from '../hooks/useDepartmentTree';

const mockDepartment: Department = {
  id: 1,
  name: 'Engineering',
  description: 'Software development team',
  parentId: 2,
  employeeCount: 15,
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

describe('DepartmentForm', () => {
  const mockCreateMutate = vi.fn();
  const mockUpdateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useCreateDepartment).mockReturnValue({
      mutateAsync: mockCreateMutate,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(departmentHooks.useUpdateDepartment).mockReturnValue({
      mutateAsync: mockUpdateMutate,
      isPending: false,
      error: null,
    } as any);
  });

  it('renders create form correctly', () => {
    render(<DepartmentForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/department name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByTestId('department-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create department/i })).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(<DepartmentForm department={mockDepartment} />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Software development team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update department/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<DepartmentForm />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/department name is required/i)).toBeInTheDocument();
    });

    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('submits create form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    mockCreateMutate.mockResolvedValue({});

    render(<DepartmentForm onSuccess={mockOnSuccess} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/department name/i), {
      target: { value: 'New Department' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'New department description' },
    });

    const submitButton = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: 'New Department',
        description: 'New department description',
        parentId: undefined,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('submits update form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    mockUpdateMutate.mockResolvedValue({});

    render(
      <DepartmentForm department={mockDepartment} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    fireEvent.change(screen.getByDisplayValue('Engineering'), {
      target: { value: 'Updated Engineering' },
    });

    const submitButton = screen.getByRole('button', { name: /update department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Engineering',
        description: 'Software development team',
        parentId: 2,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('shows loading state during submission', () => {
    vi.mocked(departmentHooks.useCreateDepartment).mockReturnValue({
      mutateAsync: mockCreateMutate,
      isPending: true,
      error: null,
    } as any);

    render(<DepartmentForm />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /create department/i });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });

  it('shows error message on submission error', () => {
    const error = {
      response: {
        data: {
          message: 'Department name already exists',
        },
      },
    };

    vi.mocked(departmentHooks.useCreateDepartment).mockReturnValue({
      mutateAsync: mockCreateMutate,
      isPending: false,
      error,
    } as any);

    render(<DepartmentForm />, { wrapper: createWrapper() });

    expect(screen.getByText(/department name already exists/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();

    render(<DepartmentForm onCancel={mockOnCancel} />, { wrapper: createWrapper() });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('sets parent ID when provided', () => {
    render(<DepartmentForm parentId={5} />, { wrapper: createWrapper() });

    const select = screen.getByTestId('department-select');
    expect(select).toHaveValue('5');
  });

  it('validates name length', async () => {
    render(<DepartmentForm />, { wrapper: createWrapper() });

    const nameInput = screen.getByLabelText(/department name/i);
    fireEvent.change(nameInput, {
      target: { value: 'a'.repeat(101) }, // 101 characters
    });

    const submitButton = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be less than 100 characters/i)).toBeInTheDocument();
    });
  });

  it('validates description length', async () => {
    render(<DepartmentForm />, { wrapper: createWrapper() });

    const nameInput = screen.getByLabelText(/department name/i);
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'a'.repeat(501) }, // 501 characters
    });

    const submitButton = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
    });
  });
});