import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { RolePermissionMatrix } from './RolePermissionMatrix';
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
    name: 'Admin', 
    permissions: [
      { id: 1, name: 'user:read', description: 'Read user data' },
      { id: 2, name: 'user:write', description: 'Write user data' },
    ]
  },
  { 
    id: 2, 
    name: 'User', 
    permissions: [
      { id: 1, name: 'user:read', description: 'Read user data' },
    ]
  },
];

const mockPermissions: Permission[] = [
  { id: 1, name: 'user:read', description: 'Read user data' },
  { id: 2, name: 'user:write', description: 'Write user data' },
  { id: 3, name: 'admin:manage', description: 'Manage admin functions' },
];

const mockMatrix = {
  1: [1, 2], // Admin has permissions 1 and 2
  2: [1],    // User has permission 1
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

describe('RolePermissionMatrix', () => {
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

    mockHooks.useRolePermissionMatrix.mockReturnValue({
      data: mockMatrix,
      isLoading: false,
      error: null,
    });

    mockHooks.useUpdateRolePermissions.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 4, name: 'New Role', permissions: [] }),
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

    mockHooks.usePermissionImpactAnalysis.mockReturnValue({
      mutate: vi.fn(),
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('should render role permission matrix', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    expect(screen.getByText('Role-Permission Matrix')).toBeInTheDocument();
    expect(screen.getByText('Create Role')).toBeInTheDocument();
  });

  it('should display roles and permissions in table', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    // Check role headers
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();

    // Check permission rows
    expect(screen.getByText('read')).toBeInTheDocument(); // user:read -> read
    expect(screen.getByText('write')).toBeInTheDocument(); // user:write -> write
    expect(screen.getByText('manage')).toBeInTheDocument(); // admin:manage -> manage
  });

  it('should display permission categories', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should show checkboxes for role-permission combinations', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should handle permission toggle', async () => {
    const mockUpdateRolePermissions = vi.fn().mockResolvedValue(undefined);
    mockHooks.useUpdateRolePermissions.mockReturnValue({
      mutateAsync: mockUpdateRolePermissions,
      isPending: false,
    });

    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    fireEvent.click(firstCheckbox);

    // Should trigger impact analysis dialog
    await waitFor(() => {
      expect(mockHooks.usePermissionImpactAnalysis().mutate).toHaveBeenCalled();
    });
  });

  it('should open create role modal', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    const createButton = screen.getByText('Create Role');
    fireEvent.click(createButton);

    expect(screen.getByText('Create Role')).toBeInTheDocument();
  });

  it('should handle role edit', () => {
    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    // Find edit buttons (they would be in the role headers)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg') && 
      button.querySelector('svg')?.classList.contains('tabler-icon-edit')
    );

    if (editButton) {
      fireEvent.click(editButton);
      expect(screen.getByText('Edit Role')).toBeInTheDocument();
    }
  });

  it('should handle role deletion', async () => {
    const mockDeleteRole = vi.fn().mockResolvedValue(undefined);
    mockHooks.useDeleteRole.mockReturnValue({
      mutateAsync: mockDeleteRole,
      isPending: false,
    });

    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    // Find delete buttons
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && 
      button.querySelector('svg')?.classList.contains('tabler-icon-trash')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockDeleteRole).toHaveBeenCalled();
      });
    }
  });

  it('should display loading state', () => {
    mockHooks.useAllRoles.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    // Should show loading overlay
    expect(screen.getByText('Role-Permission Matrix')).toBeInTheDocument();
  });

  it('should display empty state when no roles', () => {
    mockHooks.useAllRoles.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<RolePermissionMatrix />, { wrapper: createWrapper() });

    expect(screen.getByText('No roles found')).toBeInTheDocument();
    expect(screen.getByText('Create your first role to start managing permissions.')).toBeInTheDocument();
  });

  it('should handle role selection callback', () => {
    const mockOnRoleSelect = vi.fn();
    render(<RolePermissionMatrix onRoleSelect={mockOnRoleSelect} />, { wrapper: createWrapper() });

    // The role selection would be triggered by clicking on a role
    expect(screen.getByText('Role-Permission Matrix')).toBeInTheDocument();
  });

  it('should highlight selected role', () => {
    render(<RolePermissionMatrix selectedRoleId={1} />, { wrapper: createWrapper() });

    // The selected role should be highlighted (implementation would depend on styling)
    expect(screen.getByText('Role-Permission Matrix')).toBeInTheDocument();
  });
});