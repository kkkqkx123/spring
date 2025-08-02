import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
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
      mutateAsync: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Updated Role',
        permissions: [],
      }),
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

  it('should open create role modal', async () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    const createButton = screen.getByRole('button', {
      name: /create custom role/i,
    });
    fireEvent.click(createButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /create custom role/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/role name/i)).toBeInTheDocument();
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
    const createButton = screen.getByRole('button', {
      name: /create custom role/i,
    });
    fireEvent.click(createButton);

    const dialog = await screen.findByRole('dialog');

    // Fill in form
    const nameInput = within(dialog).getByLabelText(/role name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });

    // Select some permissions
    const permissionsInput = within(dialog).getByRole('combobox');
    fireEvent.mouseDown(permissionsInput);
    const option = await screen.findByText(/read - Read user data/i);
    fireEvent.click(option);

    // Submit form
    const submitButton = within(dialog).getByRole('button', {
      name: /create role/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateRole).toHaveBeenCalledWith({
        name: 'Test Role',
        description: undefined,
        permissionIds: [1],
      });
    });
  });

  it('should handle role editing', async () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find edit button by its icon
    const editButton = screen
      .getAllByRole('button')
      .find(button => button.querySelector('.tabler-icon-edit'));

    if (!editButton) {
      throw new Error('Edit button not found');
    }
    fireEvent.click(editButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /edit custom role/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByDisplayValue('Custom Admin')
    ).toBeInTheDocument();
  });

  it('should handle role cloning', async () => {
    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find clone button by its icon
    const cloneButton = screen
      .getAllByRole('button')
      .find(button => button.querySelector('.tabler-icon-copy'));

    if (!cloneButton) {
      throw new Error('Clone button not found');
    }
    fireEvent.click(cloneButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /clone custom role/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByDisplayValue('Custom Admin (Copy)')
    ).toBeInTheDocument();
  });

  it('should handle role deletion', async () => {
    const mockDeleteRole = vi.fn().mockResolvedValue(undefined);
    mockHooks.useDeleteRole.mockReturnValue({
      mutateAsync: mockDeleteRole,
      isPending: false,
    });

    render(<CustomRoleCreation />, { wrapper: createWrapper() });

    // Find delete button by its icon
    const deleteButton = screen
      .getAllByRole('button')
      .find(button => button.querySelector('.tabler-icon-trash'));

    if (!deleteButton) {
      throw new Error('Delete button not found');
    }
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteRole).toHaveBeenCalledWith(1);
    });
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

  it('should call onRoleCreated callback on creation', async () => {
    const mockOnRoleCreated = vi.fn();
    const newRole = { id: 3, name: 'Test Role', permissions: [] };
    const mockCreateRole = vi.fn().mockResolvedValue(newRole);

    mockHooks.useCreateRole.mockReturnValue({
      mutateAsync: mockCreateRole,
      isPending: false,
    });

    render(<CustomRoleCreation onRoleCreated={mockOnRoleCreated} />, {
      wrapper: createWrapper(),
    });

    // Open create modal and create a role
    const createButton = screen.getByRole('button', {
      name: /create custom role/i,
    });
    fireEvent.click(createButton);

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/role name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });

    // Select a permission
    const permissionsInput = within(dialog).getByRole('combobox');
    fireEvent.mouseDown(permissionsInput);
    const option = await screen.findByText(/read - Read user data/i);
    fireEvent.click(option);

    const submitButton = within(dialog).getByRole('button', {
      name: /create role/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRoleCreated).toHaveBeenCalledWith(newRole);
    });
  });
});
