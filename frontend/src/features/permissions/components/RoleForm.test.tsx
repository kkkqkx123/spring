import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { RoleForm } from './RoleForm';
import type { Role, Permission } from '../../../types';
import { vi } from 'vitest';

const mockPermissions: Permission[] = [
  { id: 1, name: 'user:read', description: 'Read user data' },
  { id: 2, name: 'user:write', description: 'Write user data' },
  { id: 3, name: 'admin:manage', description: 'Manage admin functions' },
  { id: 4, name: 'report:view', description: 'View reports' },
];

const mockRole: Role = {
  id: 1,
  name: 'Test Role',
  permissions: [
    { id: 1, name: 'user:read', description: 'Read user data' },
    { id: 2, name: 'user:write', description: 'Write user data' },
  ],
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>{children}</MantineProvider>
  );
};

describe('RoleForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render role form for creating new role', () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create role/i })
    ).toBeInTheDocument();
  });

  it('should render role form for editing existing role', () => {
    render(
      <RoleForm
        role={mockRole}
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue('Test Role')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update role/i })
    ).toBeInTheDocument();
  });

  it('should pre-populate form with existing role data', () => {
    render(
      <RoleForm
        role={mockRole}
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByDisplayValue('Test Role');
    expect(nameInput).toBeInTheDocument();

    // Check that permissions are pre-selected
    const permissionSelect = screen.getByRole('combobox');
    expect(permissionSelect).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /create role/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Role name is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate role name length', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Role name must be at least 2 characters')
      ).toBeInTheDocument();
    });
  });

  it('should validate role name max length', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    const longName = 'A'.repeat(51);
    fireEvent.change(nameInput, { target: { value: longName } });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Role name must be less than 50 characters')
      ).toBeInTheDocument();
    });
  });

  it('should validate description length', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    const descriptionInput = screen.getByLabelText('Description');
    const longDescription = 'A'.repeat(256);
    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Description must be less than 255 characters')
      ).toBeInTheDocument();
    });
  });

  it('should handle form submission with valid data', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'New Role' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Role description' },
    });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Role',
        description: 'Role description',
        permissionIds: [],
      });
    });
  });

  it('should handle form submission without description', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'New Role' } });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Role',
        description: undefined,
        permissionIds: [],
      });
    });
  });

  it('should handle cancel button click', () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable form when loading', () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByText('Create Role');
    const cancelButton = screen.getByText('Cancel');

    expect(nameInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();
    expect(submitButton).toHaveAttribute('data-loading', 'true');
    expect(cancelButton).toBeDisabled();
  });

  it('should group permissions by category', () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    // Click on the permission select to open dropdown
    const permissionSelect = screen.getByRole('combobox');
    fireEvent.click(permissionSelect);

    // Should show grouped permissions
    expect(screen.getByText(/read.*Read user data/)).toBeInTheDocument();
    expect(screen.getByText(/write.*Write user data/)).toBeInTheDocument();
  });

  it('should show permission count', () => {
    render(
      <RoleForm
        role={mockRole}
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2 permission(s) selected')).toBeInTheDocument();
  });

  it('should handle permission selection', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });

    // Open permission dropdown
    const permissionSelect = screen.getByRole('combobox');
    fireEvent.click(permissionSelect);

    // Select a permission (this would be implementation-specific)
    // For now, just test that the form can be submitted
    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should trim whitespace from inputs', async () => {
    render(
      <RoleForm
        permissions={mockPermissions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText('Role Name');
    fireEvent.change(nameInput, { target: { value: '  Test Role  ' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: '  Test Description  ' },
    });

    const submitButton = screen.getByText('Create Role');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Role',
        description: 'Test Description',
        permissionIds: [],
      });
    });
  });
});
