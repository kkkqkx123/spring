import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { UserRoleAssignment } from './UserRoleAssignment';
import * as permissionHooks from '../hooks/usePermissions';
import type { User, Role } from '../../../types';
import { vi } from 'vitest';

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Mock the hooks
vi.mock('../hooks/usePermissions');
const mockHooks = permissionHooks as any;

const mockUsers: User[] = [
  {
    id: 1,
    username: 'john.doe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    roles: [
      { id: 1, name: 'Admin', permissions: [] },
      { id: 2, name: 'User', permissions: [] },
    ],
  },
  {
    id: 2,
    username: 'jane.smith',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    roles: [{ id: 2, name: 'User', permissions: [] }],
  },
];

const mockRoles: Role[] = [
  { id: 1, name: 'Admin', permissions: [] },
  { id: 2, name: 'User', permissions: [] },
  { id: 3, name: 'Manager', permissions: [] },
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

describe('UserRoleAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful data fetching
    mockHooks.useUsersWithRoles.mockReturnValue({
      data: {
        content: mockUsers,
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockHooks.useAllRoles.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    // Mock mutations
    mockHooks.useAssignUserRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);

    mockHooks.useRemoveUserRole.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);

    mockHooks.useBulkAssignRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);

    mockHooks.useBulkRemoveRoles.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);
  });

  it('should render user role assignment interface', () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    expect(screen.getByText('User Role Assignment')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();

    // Check if users are displayed
    expect(screen.getByText('john.doe')).toBeInTheDocument();
    expect(screen.getByText('jane.smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display user roles as badges', () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // John should have Admin and User roles
    const adminBadges = screen.getAllByText('Admin');
    const userBadges = screen.getAllByText('User');

    expect(adminBadges.length).toBeGreaterThan(0);
    expect(userBadges.length).toBeGreaterThan(0);
  });

  it('should handle user selection', () => {
    const mockOnUserSelect = vi.fn();
    render(<UserRoleAssignment onUserSelect={mockOnUserSelect} />, {
      wrapper: createWrapper(),
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const userCheckbox = checkboxes.find(checkbox =>
      checkbox.closest('tr')?.textContent?.includes('john.doe')
    );

    if (userCheckbox) {
      fireEvent.click(userCheckbox);
      expect(mockOnUserSelect).toHaveBeenCalledWith(1);
    }
  });

  it('should handle select all functionality', () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0]; // First checkbox should be select all

    fireEvent.click(selectAllCheckbox);

    // After clicking select all, bulk actions button should appear
    expect(screen.getByText(/Bulk Actions/)).toBeInTheDocument();
  });

  it('should open edit modal for user', async () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // Find edit button for a user (look for edit icon specifically)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.classList.contains('tabler-icon-edit');
    });

    expect(editButton).toBeTruthy();

    if (editButton) {
      fireEvent.click(editButton);

      await waitFor(
        () => {
          // Look for the modal title or modal content
          expect(screen.getByText(/Assign Roles/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    }
  });

  it('should handle role removal with confirmation', async () => {
    const mockRemoveUserRole = vi.fn().mockResolvedValue(undefined);
    mockHooks.useRemoveUserRole.mockReturnValue({
      mutateAsync: mockRemoveUserRole,
      isPending: false,
    } as any);

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // Find remove button in a role badge
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(
      button =>
        button.querySelector('svg') && button.closest('.mantine-Badge-root')
    );

    if (removeButton) {
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          'Are you sure you want to remove this role from the user?'
        );
        expect(mockRemoveUserRole).toHaveBeenCalled();
      });
    }

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('should open bulk actions modal', async () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // Select a user first
    const checkboxes = screen.getAllByRole('checkbox');
    const userCheckbox = checkboxes[1]; // Skip select all checkbox
    fireEvent.click(userCheckbox);

    // Click bulk actions button
    const bulkButton = screen.getByText(/Bulk Actions/);
    fireEvent.click(bulkButton);

    await waitFor(() => {
      expect(screen.getByText(/Bulk Role Management/)).toBeInTheDocument();
    });
  });

  it('should handle bulk role assignment', async () => {
    const mockBulkAssignRoles = vi.fn().mockResolvedValue(undefined);
    mockHooks.useBulkAssignRoles.mockReturnValue({
      mutateAsync: mockBulkAssignRoles,
      isPending: false,
    } as any);

    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // Select users and open bulk modal
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first user

    const bulkButton = screen.getByText(/Bulk Actions/);
    fireEvent.click(bulkButton);

    await waitFor(() => {
      expect(screen.getByText(/Bulk Role Management/)).toBeInTheDocument();
    });

    // Select roles and assign
    const assignButton = screen.getByText('Assign Roles');
    fireEvent.click(assignButton);

    // Should not call API if no roles selected
    expect(mockBulkAssignRoles).not.toHaveBeenCalled();
  });

  it('should display loading state', () => {
    mockHooks.useUsersWithRoles.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    expect(
      document.querySelector('.mantine-LoadingOverlay-root')
    ).toBeInTheDocument();
  });

  it('should display empty state when no users found', () => {
    mockHooks.useUsersWithRoles.mockReturnValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('No users available.')).toBeInTheDocument();
  });

  it('should handle search functionality', () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(searchInput).toHaveValue('john');
  });

  it('should display user status badges', () => {
    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBe(2); // Both users are active
  });

  it('should show pagination when multiple pages exist', () => {
    mockHooks.useUsersWithRoles.mockReturnValue({
      data: {
        content: mockUsers,
        totalElements: 20,
        totalPages: 2,
        size: 10,
        number: 0,
        first: true,
        last: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<UserRoleAssignment />, { wrapper: createWrapper() });

    // Pagination should be visible
    expect(
      document.querySelector('.mantine-Pagination-root')
    ).toBeInTheDocument();
  });
});
