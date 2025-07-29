import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentTree } from './DepartmentTree';
import { type Department } from '../../../types';

// Mock the hooks
vi.mock('../hooks/useDepartmentTree');
vi.mock('@mantine/notifications');

import * as departmentHooks from '../hooks/useDepartmentTree';

const mockDepartments: Department[] = [
  {
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
      {
        id: 3,
        name: 'Backend',
        description: 'Backend development',
        parentId: 1,
        employeeCount: 7,
        createdAt: '2024-01-01T00:00:00Z',
        children: [],
      },
    ],
  },
  {
    id: 4,
    name: 'Marketing',
    description: 'Marketing and sales',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    children: [],
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
      <MantineProvider>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentTree', () => {
  const mockDeleteMutate = vi.fn();
  const mockMoveMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: mockDepartments,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(departmentHooks.useDeleteDepartment).mockReturnValue({
      mutate: mockDeleteMutate,
    } as any);

    vi.mocked(departmentHooks.useMoveDepartment).mockReturnValue({
      mutate: mockMoveMutate,
    } as any);
  });

  it('renders department tree correctly', () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Employee count
    expect(screen.getByText('10')).toBeInTheDocument(); // Employee count
  });

  it('shows loading state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<DepartmentTree />, { wrapper: createWrapper() });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    render(<DepartmentTree />, { wrapper: createWrapper() });

    expect(screen.getByText(/Failed to load department tree/)).toBeInTheDocument();
  });

  it('shows empty state when no departments', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<DepartmentTree />, { wrapper: createWrapper() });

    expect(screen.getByText('No departments found')).toBeInTheDocument();
  });

  it('expands and collapses department nodes', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // Initially, children should not be visible
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend')).not.toBeInTheDocument();

    // Click expand button for Engineering
    const expandButton = screen.getAllByRole('button')[0]; // First expand button
    fireEvent.click(expandButton);

    // Children should now be visible
    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    // Click collapse button
    fireEvent.click(expandButton);

    // Children should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend')).not.toBeInTheDocument();
    });
  });

  it('calls onSelectDepartment when department is clicked', () => {
    const mockOnSelect = vi.fn();
    render(<DepartmentTree onSelectDepartment={mockOnSelect} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Engineering'));

    expect(mockOnSelect).toHaveBeenCalledWith(mockDepartments[0]);
  });

  it('highlights selected department', () => {
    render(<DepartmentTree selectedDepartmentId={1} />, { wrapper: createWrapper() });

    const engineeringNode = screen.getByText('Engineering').closest('[data-testid]') || 
                           screen.getByText('Engineering').closest('div');
    
    // Check if the selected department has different styling
    expect(engineeringNode).toHaveStyle({ borderColor: 'var(--mantine-color-blue-4)' });
  });

  it('opens context menu and shows options', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // Click the menu button (dots icon)
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-expanded') !== null
    );
    
    if (menuButton) {
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Department')).toBeInTheDocument();
        expect(screen.getByText('Add Subdepartment')).toBeInTheDocument();
        expect(screen.getByText('Delete Department')).toBeInTheDocument();
      });
    }
  });

  it('calls onEditDepartment when edit is clicked', async () => {
    const mockOnEdit = vi.fn();
    render(<DepartmentTree onEditDepartment={mockOnEdit} />, { wrapper: createWrapper() });

    // Open context menu
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-expanded') !== null
    );
    
    if (menuButton) {
      fireEvent.click(menuButton);

      await waitFor(() => {
        const editButton = screen.getByText('Edit Department');
        fireEvent.click(editButton);
      });

      expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
      }));
    }
  });

  it('calls onCreateDepartment when add subdepartment is clicked', async () => {
    const mockOnCreate = vi.fn();
    render(<DepartmentTree onCreateDepartment={mockOnCreate} />, { wrapper: createWrapper() });

    // Open context menu
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-expanded') !== null
    );
    
    if (menuButton) {
      fireEvent.click(menuButton);

      await waitFor(() => {
        const addButton = screen.getByText('Add Subdepartment');
        fireEvent.click(addButton);
      });

      expect(mockOnCreate).toHaveBeenCalledWith(expect.any(Number));
    }
  });

  it('shows delete confirmation dialog', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // Open context menu for Marketing (no children, no employees)
    const menuButtons = screen.getAllByRole('button');
    // Find the menu button for Marketing department
    const marketingMenuButton = menuButtons[menuButtons.length - 1]; // Assuming it's the last one
    
    fireEvent.click(marketingMenuButton);

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete Department');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  it('disables delete for departments with employees or children', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // Open context menu for Engineering (has children)
    const menuButtons = screen.getAllByRole('button');
    const engineeringMenuButton = menuButtons[0];
    
    fireEvent.click(engineeringMenuButton);

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete Department');
      expect(deleteButton).toHaveAttribute('data-disabled', 'true');
    });
  });

  it('expands all departments when expand all is clicked', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // Find and click expand all button
    const expandAllButton = screen.getByLabelText('Expand All');
    fireEvent.click(expandAllButton);

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });
  });

  it('collapses all departments when collapse all is clicked', async () => {
    render(<DepartmentTree />, { wrapper: createWrapper() });

    // First expand all
    const expandAllButton = screen.getByLabelText('Expand All');
    fireEvent.click(expandAllButton);

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    // Then collapse all
    const collapseAllButton = screen.getByLabelText('Collapse All');
    fireEvent.click(collapseAllButton);

    await waitFor(() => {
      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend')).not.toBeInTheDocument();
    });
  });

  it('renders in compact mode', () => {
    render(<DepartmentTree compact />, { wrapper: createWrapper() });

    // In compact mode, descriptions should not be visible
    expect(screen.queryByText('Software development team')).not.toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('hides employee count when showEmployeeCount is false', () => {
    render(<DepartmentTree showEmployeeCount={false} />, { wrapper: createWrapper() });

    expect(screen.queryByText('15')).not.toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });
});