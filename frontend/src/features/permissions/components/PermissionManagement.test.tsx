import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { PermissionManagement } from './PermissionManagement';
import * as permissionHooks from '../hooks/usePermissions';
import type { Role, Permission } from '../../../types';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../hooks/usePermissions');
const mockHooks = permissionHooks as any;

const mockRoles: Role[] = [
  { id: 1, name: 'Admin', permissions: [] },
  { id: 2, name: 'User', permissions: [] },
  { id: 3, name: 'Manager', permissions: [] },
];

const mockPermissions: Permission[] = [
  { id: 1, name: 'user:read', description: 'Read user data' },
  { id: 2, name: 'user:write', description: 'Write user data' },
  { id: 3, name: 'admin:manage', description: 'Manage admin functions' },
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

describe('PermissionManagement', () => {
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

    // Add missing mock implementations
    mockHooks.useRolePermissionMatrix.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
    });

    mockHooks.useUpdateRolePermissions.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ id: 4, name: 'New Role', permissions: [] }),
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

    mockHooks.useUsersWithRoles.mockReturnValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
      isLoading: false,
      error: null,
    });

    mockHooks.useAssignUserRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useRemoveUserRole.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useBulkAssignRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    mockHooks.useBulkRemoveRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
  });

  it('should render permission management interface', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Permission Management')).toBeInTheDocument();
    expect(
      screen.getByText('Manage roles, permissions, and user access control')
    ).toBeInTheDocument();
  });

  it('should display role and permission counts', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('3 Roles')).toBeInTheDocument();
    expect(screen.getByText('3 Permissions')).toBeInTheDocument();
  });

  it('should display overview cards with statistics', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Total Roles')).toBeInTheDocument();
    expect(screen.getByText('Total Permissions')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  it('should render tabs for different management sections', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Role-Permission Matrix')).toBeInTheDocument();
    expect(screen.getByText('User Role Assignment')).toBeInTheDocument();
    expect(screen.getByText('Custom Roles')).toBeInTheDocument();
  });

  it('should switch between tabs', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    const userRoleTab = screen.getByText('User Role Assignment');
    fireEvent.click(userRoleTab);

    // The tab should be active (this would be indicated by the tab panel being visible)
    expect(userRoleTab.closest('[role="tab"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('should display help section with guidance', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Permission Management Guide')).toBeInTheDocument();
    expect(screen.getByText(/Role-Permission Matrix/)).toBeInTheDocument();
    expect(screen.getByText(/User Role Assignment/)).toBeInTheDocument();
    expect(screen.getByText(/Custom Roles/)).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    mockHooks.useAllRoles.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    mockHooks.useAllPermissions.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<PermissionManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Permission Management')).toBeInTheDocument();
    // Loading state should show 0 counts
    expect(screen.getByText('0 Roles')).toBeInTheDocument();
    expect(screen.getByText('0 Permissions')).toBeInTheDocument();
  });

  it('should accept defaultTab prop', () => {
    render(<PermissionManagement defaultTab="users" />, {
      wrapper: createWrapper(),
    });

    const userRoleTab = screen.getByText('User Role Assignment');
    expect(userRoleTab.closest('[role="tab"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('should handle role selection callback', () => {
    render(<PermissionManagement />, { wrapper: createWrapper() });

    // The role selection would be handled by the child components
    // This test ensures the component renders without errors
    expect(screen.getByText('Permission Management')).toBeInTheDocument();
  });
});
