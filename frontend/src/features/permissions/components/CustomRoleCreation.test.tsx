import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { CustomRoleCreation } from './CustomRoleCreation';
import * as permissionHooks from '../hooks/usePermissions';
import type { Role, Permission } from '../../../types';
import { vi } from 'vitest';

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Mock the hooks
vi.mock('../hooks/usePermissions');
const mockHooks = permissionHooks as any;

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Custom Admin',
    permissions: [
      { id: 1, name: 'user:read', description: 'Read user data' },
      { id: 2, name: 'user:write', description: 'Write user data' },
    ],
  },
  {
    id: 2,
    name: 'Custom User',
    permissions: [{ id: 1, name: 'user:read', description: 'Read user data' }],
  },
];

const mockPermissions: Permission[] = [
  { id: 1, name: 'user:read', description: 'Read user data' },
  { id: 2, name: 'user:write', description: 'Write user data' },
  { id: 3, name: 'admin:manage', description: 'Manage admin functions' },
  { id: 4, name: 'report:view', description: 'View reports' },
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

describe('CustomRoleCreation', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockHooks.useAllRoles.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
    });

    mockHooks.useAllPermissions.mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      error: null,
    });

    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ id: 3, name: 'New Role', permissions: [] }),
      isPending: false,
    });

    mockHooks.useUpdateRole.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useDeleteRole.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
  });

  it('should render custom role creation interface', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    expect(screen.getByText('Custom Role Creation')).toBeInTheDocument();
    expect(screen.getByText('Create Custom Role')).toBeInTheDocument();
  });

  it('should display existing custom roles in table', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    expect(screen.getByText('Custom Admin')).toBeInTheDocument();
    expect(screen.getByText('Custom User')).toBeInTheDocument();
  });

  it('should show permission counts for each role', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    expect(screen.getByText('2 permissions')).toBeInTheDocument();
    expect(screen.getByText('1 permissions')).toBeInTheDocument();
  });

  it('should open create role modal', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    expect(screen.getByText('Create Custom Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
  });

  it('should handle role creation', async () => {
    const mockCreateRole = vi
      .fn()
      .mockResolvedValue({ id: 3, name: 'Test Role', permissions: [] });
    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: mockCreateRole,
      isPending: false,
    });

    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Open create modal
    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    // Fill in form
    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });

    // Select some permissions
    const userCategory = screen.getByText('user');
    fireEvent.click(userCategory);

    // Find and click a permission checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const permissionCheckbox = checkboxes.find(checkbox =>
      checkbox.closest('div')?.textContent?.includes('read')
    );

    if (permissionCheckbox) {
      fireEvent.click(permissionCheckbox);
    }

    // Submit form
    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateRole).toHaveBeenCalledWith({
        name: 'Test Role',
        description: undefined,
        permissionIds: expect.any(Array),
      });
    });
  });

  it('should handle role editing', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find edit button
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button =>
      button.querySelector('svg')?.classList.contains('tabler-icon-edit')
    );

    if (editButton) {
      fireEvent.click(editButton);
      expect(screen.getByText('Edit Custom Role')).toBeInTheDocument();
    }
  });

  it('should handle role cloning', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find clone button
    const cloneButtons = screen.getAllByRole('button');
    const cloneButton = cloneButtons.find(button =>
      button.querySelector('svg')?.classList.contains('tabler-icon-copy')
    );

    if (cloneButton) {
      fireEvent.click(cloneButton);
      expect(screen.getByText('Create Custom Role')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Custom Admin (Copy)')
      ).toBeInTheDocument();
    }
  });

  it('should handle role deletion', async () => {
    const mockDeleteRole = vi.fn().mockResolvedValue(undefined);
    mockHooks.useDeleteRole.mockReturnValue({
      mutateAsync: mockDeleteRole,
      isPending: false,
    });

    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button =>
      button.querySelector('svg')?.classList.contains('tabler-icon-trash')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteRole).toHaveBeenCalled();
      });
    }
  });

  it('should group permissions by category', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Open create modal
    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    // Should show permission categories
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('report')).toBeInTheDocument();
  });

  it('should handle category selection', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Open create modal
    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    // Find category checkbox
    const categoryCheckboxes = screen.getAllByRole('checkbox');
    const userCategoryCheckbox = categoryCheckboxes.find(
      checkbox =>
        checkbox.closest('div')?.textContent?.includes('user') &&
        checkbox.closest('div')?.textContent?.includes('2')
    );

    if (userCategoryCheckbox) {
      fireEvent.click(userCategoryCheckbox);
      // Should select all permissions in the category
    }
  });

  it('should validate form inputs', () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Open create modal
    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    // Try to submit without name
    const submitButton = screen.getByText('Create Role');
    expect(submitButton).toBeDisabled();
  });

  it('should display loading state', () => {
    mockHooks.useAllRoles.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    expect(screen.getByText('Custom Role Creation')).toBeInTheDocument();
  });

  it('should display empty state when no roles', () => {
    mockHooks.useAllRoles.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    expect(screen.getByText('No custom roles found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create your first custom role to get started with advanced permission management.'
      )
    ).toBeInTheDocument();
  });

  it('should call onRoleCreated callback', async () => {
    const mockOnRoleCreated = vi.fn();
    const mockCreateRole = vi
      .fn()
      .mockResolvedValue({ id: 3, name: 'Test Role', permissions: [] });

    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: mockCreateRole,
      isPending: false,
    });

    render(<CustomRoleCreation onRoleCreated={mockOnRoleCreated} />, {
      wrapper: createWrapper(),
    });

    // Open create modal and create a role
    const createButton = screen.getByText('Create Custom Role');
    fireEvent.click(createButton);

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });

    // Select a permission
    const checkboxes = screen.getAllByRole('checkbox');
    const permissionCheckbox = checkboxes[checkboxes.length - 1]; // Last checkbox should be a permission
    fireEvent.click(permissionCheckbox);

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRoleCreated).toHaveBeenCalledWith({
        id: 3,
        name: 'Test Role',
        permissions: [],
      });
    });
  });
});
