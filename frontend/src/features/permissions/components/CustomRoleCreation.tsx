/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Text,
  Modal,
  Alert,
  LoadingOverlay,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCopy,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  useAllRoles,
  useAllPermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/usePermissions';
import type { Role } from '../../../types';
import { RoleForm } from './RoleForm';

interface CustomRoleCreationProps {
  onRoleCreated?: (role: Role) => void;
}

export const CustomRoleCreation: React.FC<CustomRoleCreationProps> = ({
  onRoleCreated,
}) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const { data: roles = [], isLoading: rolesLoading } = useAllRoles();
  const { data: permissions = [], isLoading: permissionsLoading } =
    useAllPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const isLoading = rolesLoading || permissionsLoading;

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsCloning(false);
    openModal();
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsCloning(false);
    openModal();
  };

  const handleCloneRole = (role: Role) => {
    setEditingRole(role);
    setIsCloning(true);
    openModal();
  };

  const handleDeleteRole = async (roleId: number) => {
    if (
      window.confirm(
        'Are you sure you want to delete this role? This action cannot be undone and may affect users with this role.'
      )
    ) {
      await deleteRole.mutateAsync(roleId);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    description?: string;
    permissionIds: number[];
  }) => {
    try {
      if (editingRole && !isCloning) {
        const updatedRole = await updateRole.mutateAsync({
          ...data,
          id: editingRole.id,
        });
        onRoleCreated?.(updatedRole);
      } else {
        const newRole = await createRole.mutateAsync(data);
        onRoleCreated?.(newRole);
      }
      closeModal();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const getModalTitle = () => {
    if (isCloning) return 'Clone Custom Role';
    return editingRole ? 'Edit Custom Role' : 'Create Custom Role';
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Custom Role Creation</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateRole}>
          Create Custom Role
        </Button>
      </Group>

      <Card>
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />

          {roles.length === 0 ? (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="No custom roles found"
            >
              Create your first custom role to get started with advanced
              permission management.
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Role Name</Table.Th>
                  <Table.Th>Permissions</Table.Th>
                  <Table.Th>Users</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {roles.map(role => (
                  <Table.Tr key={role.id}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Group>
                          <IconShield size={16} />
                          <Text fw={500}>{role.name}</Text>
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Badge variant="light" size="sm">
                          {role.permissions?.length || 0} permissions
                        </Badge>
                        {role.permissions?.slice(0, 3).map(permission => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            size="xs"
                          >
                            {permission.name.split(':').pop()}
                          </Badge>
                        ))}
                        {(role.permissions?.length || 0) > 3 && (
                          <Badge variant="outline" size="xs">
                            +{(role.permissions?.length || 0) - 3} more
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">-</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">-</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit role">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => handleEditRole(role)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Clone role">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => handleCloneRole(role)}
                          >
                            <IconCopy size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete role">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </div>
      </Card>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={getModalTitle()}
        size="lg"
      >
        <RoleForm
          role={
            isCloning
              ? {
                  ...editingRole!,
                  name: `${editingRole?.name} (Copy)`,
                }
              : editingRole
          }
          permissions={permissions}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={
            createRole.isPending || updateRole.isPending || permissionsLoading
          }
        />
      </Modal>
    </Stack>
  );
};
