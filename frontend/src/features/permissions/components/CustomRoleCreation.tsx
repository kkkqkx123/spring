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
  TextInput,
  Checkbox,
  Divider,
  Accordion,
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
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import {
  useAllRoles,
  useAllPermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/usePermissions';
import type { Role, Permission } from '../../../types';

interface CustomRoleCreationProps {
  onRoleCreated?: (role: Role) => void;
}

export const CustomRoleCreation: React.FC<CustomRoleCreationProps> = ({
  onRoleCreated,
}) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedPermissions: new Set<number>(),
  });

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const { data: roles = [], isLoading: rolesLoading } = useAllRoles();
  const { data: permissions = [], isLoading: permissionsLoading } =
    useAllPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const isLoading = rolesLoading || permissionsLoading;

  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const category = permission.name.split(':')[0] || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    return groups;
  }, [permissions]);

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      selectedPermissions: new Set(),
    });
    openModal();
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.permissions?.map(p => p.description).join(', ') || '',
      selectedPermissions: new Set(role.permissions?.map(p => p.id) || []),
    });
    openModal();
  };

  const handleCloneRole = (role: Role) => {
    setEditingRole(null);
    setFormData({
      name: `${role.name} (Copy)`,
      description: role.permissions?.map(p => p.description).join(', ') || '',
      selectedPermissions: new Set(role.permissions?.map(p => p.id) || []),
    });
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

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    const newSelected = new Set(formData.selectedPermissions);
    if (checked) {
      newSelected.add(permissionId);
    } else {
      newSelected.delete(permissionId);
    }
    setFormData(prev => ({ ...prev, selectedPermissions: newSelected }));
  };

  const handleCategoryToggle = (
    categoryPermissions: Permission[],
    checked: boolean
  ) => {
    const newSelected = new Set(formData.selectedPermissions);
    categoryPermissions.forEach(permission => {
      if (checked) {
        newSelected.add(permission.id);
      } else {
        newSelected.delete(permission.id);
      }
    });
    setFormData(prev => ({ ...prev, selectedPermissions: newSelected }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const roleData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      permissionIds: Array.from(formData.selectedPermissions),
    };

    try {
      if (editingRole) {
        const updatedRole = await updateRole.mutateAsync({
          ...roleData,
          id: editingRole.id,
        });
        onRoleCreated?.(updatedRole);
      } else {
        const newRole = await createRole.mutateAsync(roleData);
        onRoleCreated?.(newRole);
      }
      closeModal();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isFormValid =
    formData.name.trim().length > 0 && formData.selectedPermissions.size > 0;

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

      {/* Role Creation/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingRole ? 'Edit Custom Role' : 'Create Custom Role'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Role Name"
            placeholder="Enter role name"
            required
            value={formData.name}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                name: event.currentTarget.value,
              }))
            }
            error={
              formData.name.trim().length === 0 ? 'Role name is required' : null
            }
          />

          <TextInput
            label="Description"
            placeholder="Enter role description (optional)"
            value={formData.description}
            onChange={event =>
              setFormData(prev => ({
                ...prev,
                description: event.currentTarget.value,
              }))
            }
          />

          <Divider />

          <div>
            <Group justify="space-between" mb="md">
              <Text fw={500}>
                Permissions ({formData.selectedPermissions.size} selected)
              </Text>
              <Text size="sm" c="dimmed">
                Select permissions for this role
              </Text>
            </Group>

            <Accordion variant="contained">
              {Object.entries(groupedPermissions).map(
                ([category, categoryPermissions]) => {
                  const selectedInCategory = categoryPermissions.filter(p =>
                    formData.selectedPermissions.has(p.id)
                  ).length;
                  const allSelected =
                    selectedInCategory === categoryPermissions.length;
                  const someSelected =
                    selectedInCategory > 0 &&
                    selectedInCategory < categoryPermissions.length;

                  return (
                    <Accordion.Item key={category} value={category}>
                      <Accordion.Control>
                        <Group
                          justify="space-between"
                          style={{ width: '100%' }}
                        >
                          <Group>
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={event =>
                                handleCategoryToggle(
                                  categoryPermissions,
                                  event.currentTarget.checked
                                )
                              }
                              onClick={event => event.stopPropagation()}
                            />
                            <Text fw={500}>{category}</Text>
                          </Group>
                          <Badge variant="light" size="sm">
                            {selectedInCategory}/{categoryPermissions.length}
                          </Badge>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          {categoryPermissions.map(permission => (
                            <Group key={permission.id} gap="xs">
                              <Checkbox
                                checked={formData.selectedPermissions.has(
                                  permission.id
                                )}
                                onChange={event =>
                                  handlePermissionToggle(
                                    permission.id,
                                    event.currentTarget.checked
                                  )
                                }
                              />
                              <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>
                                  {permission.name.split(':').pop()}
                                </Text>
                                {permission.description && (
                                  <Text size="xs" c="dimmed">
                                    {permission.description}
                                  </Text>
                                )}
                              </div>
                            </Group>
                          ))}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                }
              )}
            </Accordion>
          </div>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={closeModal}
              leftSection={<IconX size={16} />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createRole.isPending || updateRole.isPending}
              disabled={!isFormValid}
              leftSection={<IconCheck size={16} />}
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
