import React, { useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Tabs,
  Modal,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconShield,
  IconUsers,
  IconKey,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { RolePermissionMatrix } from '../components/RolePermissionMatrix';
import { UserRoleAssignment } from '../components/UserRoleAssignment';
import { RoleForm } from '../components/RoleForm';
import { useRoles, usePermissions, useCreateRole } from '../hooks/usePermissions';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { useAuth } from '../../../hooks/useAuth';

const PermissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('matrix');
  const [
    createRoleModalOpened,
    { open: openCreateRoleModal, close: closeCreateRoleModal },
  ] = useDisclosure(false);

  // Queries and mutations
  const {
    data: roles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  const {
    data: permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();

  const createRole = useCreateRole();

  // Permission checks
  const canManageRoles =
    user?.roles.some(role => ['ADMIN'].includes(role.name)) ?? false;

  const isLoading = rolesLoading || permissionsLoading;
  const error = rolesError || permissionsError;

  const handleCreateRole = async (data: any) => {
    try {
      await createRole.mutateAsync(data);
      notifications.show({
        title: 'Success',
        message: 'Role created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeCreateRoleModal();
      refetchRoles();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to create role',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  if (!canManageRoles) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Access Denied"
          color="red"
        >
          You don't have permission to manage roles and permissions.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading permissions"
          color="red"
        >
          {error.message || 'Failed to load permissions data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="xl" fw={700} mb="xs">
              Permissions & Roles
            </Text>
            <Text c="dimmed">
              Manage user roles and system permissions
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateRoleModal}
          >
            Create Role
          </Button>
        </Group>

        {/* Tabs */}
        <Card padding="lg" radius="md" withBorder>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="matrix" leftSection={<IconKey size={16} />}>
                Permission Matrix
              </Tabs.Tab>
              <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
                User Assignments
              </Tabs.Tab>
              <Tabs.Tab value="roles" leftSection={<IconShield size={16} />}>
                Role Management
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="matrix" pt="lg">
              <RolePermissionMatrix 
                roles={roles || []}
                permissions={permissions || []}
                onUpdate={refetchRoles}
              />
            </Tabs.Panel>

            <Tabs.Panel value="users" pt="lg">
              <UserRoleAssignment 
                roles={roles || []}
                onUpdate={refetchRoles}
              />
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="lg">
              <Stack gap="md">
                <Text fw={500}>
                  Role Management features will be implemented here
                </Text>
                <Text size="sm" c="dimmed">
                  This section will include role creation, editing, and deletion functionality.
                </Text>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>

        {/* Create Role Modal */}
        <Modal
          opened={createRoleModalOpened}
          onClose={closeCreateRoleModal}
          title="Create New Role"
          size="md"
        >
          <RoleForm
            permissions={permissions || []}
            onSubmit={handleCreateRole}
            onCancel={closeCreateRoleModal}
            loading={createRole.isPending}
          />
        </Modal>
      </Stack>
    </Container>
  );
};

export default PermissionsPage;