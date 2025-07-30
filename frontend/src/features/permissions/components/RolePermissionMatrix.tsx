import React, { useState, useMemo } from 'react';
import {
  Table,
  Checkbox,
  Text,
  Group,
  Stack,
  Card,
  Title,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  LoadingOverlay,
  Alert,
  Modal,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  useAllRoles,
  useAllPermissions,
  useRolePermissionMatrix,
  useUpdateRolePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  usePermissionImpactAnalysis,
} from '../hooks/usePermissions';
import type { Role, Permission } from '../../../types';
import { RoleForm } from './RoleForm';
import { PermissionImpactDialog } from './PermissionImpactDialog';

interface RolePermissionMatrixProps {
  onRoleSelect?: (role: Role) => void;
  selectedRoleId?: number;
}

export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  onRoleSelect,
  selectedRoleId,
}) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [impactAnalysisData, setImpactAnalysisData] = useState<{
    roleId: number;
    permissionIds: number[];
  } | null>(null);

  const [roleFormOpened, { open: openRoleForm, close: closeRoleForm }] =
    useDisclosure(false);
  const [
    impactDialogOpened,
    { open: openImpactDialog, close: closeImpactDialog },
  ] = useDisclosure(false);

  const { data: roles = [], isLoading: rolesLoading } = useAllRoles();
  const { data: permissions = [], isLoading: permissionsLoading } =
    useAllPermissions();
  const { data: matrix = {}, isLoading: matrixLoading } =
    useRolePermissionMatrix();

  const updateRolePermissions = useUpdateRolePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const analyzeImpact = usePermissionImpactAnalysis();

  const isLoading = rolesLoading || permissionsLoading || matrixLoading;

  // Group permissions by category for better organization
  const groupedPermissions = useMemo(() => {
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

  const handlePermissionToggle = async (
    roleId: number,
    permissionId: number,
    checked: boolean
  ) => {
    const currentPermissions = matrix[roleId] || [];
    const newPermissions = checked
      ? [...currentPermissions, permissionId]
      : currentPermissions.filter(id => id !== permissionId);

    // Show impact analysis for significant changes
    if (newPermissions.length !== currentPermissions.length) {
      setImpactAnalysisData({ roleId, permissionIds: newPermissions });
      openImpactDialog();
    } else {
      await updateRolePermissions.mutateAsync({
        roleId,
        permissionIds: newPermissions,
      });
    }
  };

  const handleConfirmPermissionChange = async () => {
    if (impactAnalysisData) {
      await updateRolePermissions.mutateAsync({
        roleId: impactAnalysisData.roleId,
        permissionIds: impactAnalysisData.permissionIds,
      });
      setImpactAnalysisData(null);
      closeImpactDialog();
    }
  };

  const handleRoleCreate = () => {
    setEditingRole(null);
    openRoleForm();
  };

  const handleRoleEdit = (role: Role) => {
    setEditingRole(role);
    openRoleForm();
  };

  const handleRoleDelete = async (roleId: number) => {
    if (
      window.confirm(
        'Are you sure you want to delete this role? This action cannot be undone.'
      )
    ) {
      await deleteRole.mutateAsync(roleId);
    }
  };

  const handleRoleFormSubmit = async (data: any) => {
    if (editingRole) {
      await updateRole.mutateAsync({ ...data, id: editingRole.id });
    } else {
      await createRole.mutateAsync(data);
    }
    closeRoleForm();
  };

  if (isLoading) {
    return (
      <Card>
        <LoadingOverlay visible />
        <div style={{ height: 400 }} />
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Role-Permission Matrix</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleRoleCreate}>
          Create Role
        </Button>
      </Group>

      {roles.length === 0 ? (
        <Alert icon={<IconInfoCircle size={16} />} title="No roles found">
          Create your first role to start managing permissions.
        </Alert>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ minWidth: 200 }}>Permission</Table.Th>
                  {roles.map(role => (
                    <Table.Th key={role.id} style={{ minWidth: 120 }}>
                      <Group gap="xs" justify="center">
                        <Text size="sm" fw={500} ta="center">
                          {role.name}
                        </Text>
                        <Group gap={4}>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => handleRoleEdit(role)}
                          >
                            <IconEdit size={12} />
                          </ActionIcon>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => handleRoleDelete(role.id)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(groupedPermissions).map(
                  ([category, categoryPermissions]) => (
                    <React.Fragment key={category}>
                      <Table.Tr>
                        <Table.Td colSpan={roles.length + 1}>
                          <Badge variant="light" size="sm">
                            {category}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                      {categoryPermissions.map(permission => (
                        <Table.Tr key={permission.id}>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text size="sm" fw={500}>
                                {permission.name.split(':').pop()}
                              </Text>
                              {permission.description && (
                                <Text size="xs" c="dimmed">
                                  {permission.description}
                                </Text>
                              )}
                            </Stack>
                          </Table.Td>
                          {roles.map(role => {
                            const hasPermission = (
                              matrix[role.id] || []
                            ).includes(permission.id);
                            return (
                              <Table.Td key={role.id} ta="center">
                                <Checkbox
                                  checked={hasPermission}
                                  onChange={event =>
                                    handlePermissionToggle(
                                      role.id,
                                      permission.id,
                                      event.currentTarget.checked
                                    )
                                  }
                                  disabled={updateRolePermissions.isPending}
                                />
                              </Table.Td>
                            );
                          })}
                        </Table.Tr>
                      ))}
                    </React.Fragment>
                  )
                )}
              </Table.Tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Role Form Modal */}
      <Modal
        opened={roleFormOpened}
        onClose={closeRoleForm}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        size="md"
      >
        <RoleForm
          role={editingRole}
          permissions={permissions}
          onSubmit={handleRoleFormSubmit}
          onCancel={closeRoleForm}
          loading={createRole.isPending || updateRole.isPending}
        />
      </Modal>

      {/* Permission Impact Analysis Dialog */}
      <PermissionImpactDialog
        opened={impactDialogOpened}
        onClose={closeImpactDialog}
        onConfirm={handleConfirmPermissionChange}
        roleId={impactAnalysisData?.roleId}
        permissionIds={impactAnalysisData?.permissionIds}
        analyzeImpact={analyzeImpact}
        loading={updateRolePermissions.isPending}
      />
    </Stack>
  );
};
