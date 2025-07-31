/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import DepartmentsPage from './DepartmentsPage';
import * as departmentHooks from '../hooks/useDepartments';
import * as departmentTreeHooks from '../hooks/useDepartmentTree';
import { useAuth } from '../../../hooks/useAuth';

// Mock the hooks
vi.mock('../../../hooks/useAuth');
vi.mock('../hooks/useDepartments', () => ({
  useDepartments: vi.fn(),
}));
vi.mock('../hooks/useDepartmentTree', () => ({
  useCreateDepartment: vi.fn(),
  useUpdateDepartment: vi.fn(),
  useDeleteDepartment: vi.fn(),
}));

vi.mock('../components/DepartmentTree', () => ({
  DepartmentTree: ({
    onSelectDepartment,
    onCreateDepartment,
    onEditDepartment,
  }: any) => (
    <div data-testid="department-tree">
      <button
        onClick={() => onSelectDepartment({ id: 1, name: 'Engineering' })}
      >
        Select Engineering
      </button>
      <button onClick={() => onCreateDepartment()}>Create Root</button>
      <button onClick={() => onCreateDepartment(1)}>Create Child</button>
      <button onClick={() => onEditDepartment({ id: 1, name: 'Engineering' })}>
        Edit Engineering
      </button>
    </div>
  ),
}));

vi.mock('../components/DepartmentForm', () => ({
  DepartmentForm: ({ parentId, onSuccess, onCancel }: any) => (
    <div data-testid="department-form">
      <span>Parent ID: {parentId || 'None'}</span>
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../components/DepartmentMoveDialog', () => ({
  DepartmentMoveDialog: ({ opened, department, onSuccess, onClose }: any) =>
    opened ? (
      <div data-testid="move-dialog">
        <span>Moving: {department?.name}</span>
        <button onClick={onSuccess}>Move</button>
        <button onClick={onClose}>Cancel Move</button>
      </div>
    ) : null,
}));

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
        <MemoryRouter>{children}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentsPage', () => {
  const mockCreateDepartment = vi.fn();
  const mockUpdateDepartment = vi.fn();
  const mockDeleteDepartment = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        roles: [{ name: 'ADMIN' }],
      },
    } as any);

    vi.mocked(departmentHooks.useDepartments).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    vi.mocked(departmentTreeHooks.useCreateDepartment).mockReturnValue({
      mutateAsync: mockCreateDepartment,
    } as any);

    vi.mocked(departmentTreeHooks.useUpdateDepartment).mockReturnValue({
      mutateAsync: mockUpdateDepartment,
    } as any);

    vi.mocked(departmentTreeHooks.useDeleteDepartment).mockReturnValue({
      mutateAsync: mockDeleteDepartment,
    } as any);
  });

  it('renders page header correctly', () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(
      screen.getByText(/manage your organization's department structure/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add department/i })
    ).toBeInTheDocument();
  });

  it('renders department tree', () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('department-tree')).toBeInTheDocument();
  });

  it('shows department detail when department is selected', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Select a department
    const selectButton = screen.getByText('Select Engineering');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-detail')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });

  it('hides department detail when close is clicked', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Select a department
    const selectButton = screen.getByText('Select Engineering');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-detail')).toBeInTheDocument();
    });

    // Close the detail
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('department-detail')).not.toBeInTheDocument();
    });
  });

  it('opens create department modal', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Click add department button
    const addButton = screen.getByRole('button', { name: /add department/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Department')).toBeInTheDocument();
      expect(screen.getByTestId('department-form')).toBeInTheDocument();
      expect(screen.getByText('Parent ID: None')).toBeInTheDocument();
    });
  });

  it('opens create subdepartment modal', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Create child department from tree
    const createChildButton = screen.getByText('Create Child');
    fireEvent.click(createChildButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Department')).toBeInTheDocument();
      expect(screen.getByTestId('department-form')).toBeInTheDocument();
      expect(screen.getByText('Parent ID: 1')).toBeInTheDocument();
    });
  });

  it('closes create modal when cancelled', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Open create modal
    const addButton = screen.getByRole('button', { name: /add department/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-form')).toBeInTheDocument();
    });

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('department-form')).not.toBeInTheDocument();
    });
  });

  it('closes create modal when saved', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Open create modal
    const addButton = screen.getByRole('button', { name: /add department/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-form')).toBeInTheDocument();
    });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByTestId('department-form')).not.toBeInTheDocument();
    });
  });

  it('creates child department from detail view', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Select a department
    const selectButton = screen.getByText('Select Engineering');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-detail')).toBeInTheDocument();
    });

    // Click add child from detail
    const addChildButton = screen.getByText('Add Child');
    fireEvent.click(addChildButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Department')).toBeInTheDocument();
      expect(screen.getByText('Parent ID: 1')).toBeInTheDocument();
    });
  });

  it('clears selection when department is deleted', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Select a department
    const selectButton = screen.getByText('Select Engineering');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-detail')).toBeInTheDocument();
    });

    // Delete the department
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    // Confirm deletion in modal
    await waitFor(async () => {
      const confirmButton = await screen.findByRole('button', {
        name: /delete department/i,
      });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockDeleteDepartment).toHaveBeenCalledWith(1);
      expect(screen.queryByTestId('department-detail')).not.toBeInTheDocument();
    });
  });

  it('adjusts grid layout based on selection', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Initially, tree should take full width
    const treeColumn = screen
      .getByTestId('department-tree')
      .closest('[class*="mantine-Grid-col"]');
    expect(treeColumn).toHaveClass('mantine-Grid-col');

    // Select a department
    const selectButton = screen.getByText('Select Engineering');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('department-detail')).toBeInTheDocument();
    });

    // Now both tree and detail should be visible
    expect(screen.getByTestId('department-tree')).toBeInTheDocument();
    expect(screen.getByTestId('department-detail')).toBeInTheDocument();
  });
});
