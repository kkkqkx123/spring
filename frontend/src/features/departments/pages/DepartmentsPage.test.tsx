import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentsPage } from './DepartmentsPage';
import { Department } from '../../../types';

// Mock the components
vi.mock('../components/DepartmentTree', () => ({
  DepartmentTree: ({ onSelectDepartment, onCreateDepartment, onEditDepartment }: any) => (
    <div data-testid="department-tree">
      <button onClick={() => onSelectDepartment({ id: 1, name: 'Engineering' })}>
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

vi.mock('../components/DepartmentDetail', () => ({
  DepartmentDetail: ({ departmentId, onCreateChild, onDelete, onClose }: any) => (
    <div data-testid="department-detail">
      <span>Department ID: {departmentId}</span>
      <button onClick={() => onCreateChild()}>Add Child</button>
      <button onClick={() => onDelete()}>Delete</button>
      <button onClick={() => onClose()}>Close</button>
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
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header correctly', () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Department Management')).toBeInTheDocument();
    expect(screen.getByText(/manage your organization's department structure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add department/i })).toBeInTheDocument();
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
      expect(screen.getByText('Department ID: 1')).toBeInTheDocument();
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
      expect(screen.getByText('Add Department')).toBeInTheDocument();
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
      expect(screen.getByText('Add Subdepartment')).toBeInTheDocument();
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
      expect(screen.getByText('Add Subdepartment')).toBeInTheDocument();
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
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByTestId('department-detail')).not.toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Find and click refresh button (it's an ActionIcon with tooltip)
    const refreshButton = screen.getByLabelText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('adjusts grid layout based on selection', async () => {
    render(<DepartmentsPage />, { wrapper: createWrapper() });

    // Initially, tree should take full width
    const treeColumn = screen.getByTestId('department-tree').closest('[class*="mantine-Grid-col"]');
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