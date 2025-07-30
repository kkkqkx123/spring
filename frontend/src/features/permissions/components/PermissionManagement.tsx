import React, { useState } from 'react';
import {
  Container,
  Title,
  Tabs,
  Stack,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Alert,
} from '@mantine/core';
import {
  IconShield,
  IconUsers,
  IconMatrix,
  IconSettings,
  IconInfoCircle,
} from '@tabler/icons-react';
import { RolePermissionMatrix } from './RolePermissionMatrix';
import { UserRoleAssignment } from './UserRoleAssignment';
import { CustomRoleCreation } from './CustomRoleCreation';
import { useAllRoles, useAllPermissions } from '../hooks/usePermissions';

interface PermissionManagementProps {
  defaultTab?: string;
}

export const PermissionManagement: React.FC<PermissionManagementProps> = ({
  defaultTab = 'matrix',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();

  const { data: roles = [], isLoading: rolesLoading } = useAllRoles();
  const { data: permissions = [], isLoading: permissionsLoading } =
    useAllPermissions();

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Permission Management</Title>
            <Text c="dimmed" size="sm">
              Manage roles, permissions, and user access control
            </Text>
          </div>
          <Group>
            <Badge variant="light" leftSection={<IconShield size={14} />}>
              {roles.length} Roles
            </Badge>
            <Badge variant="light" leftSection={<IconUsers size={14} />}>
              {permissions.length} Permissions
            </Badge>
          </Group>
        </Group>

        {/* Overview Cards */}
        <Group grow>
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Total Roles
                </Text>
                <Text size="xl" fw={700}>
                  {roles.length}
                </Text>
              </div>
              <IconShield size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Total Permissions
                </Text>
                <Text size="xl" fw={700}>
                  {permissions.length}
                </Text>
              </div>
              <IconMatrix size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Active Users
                </Text>
                <Text size="xl" fw={700}>
                  -
                </Text>
              </div>
              <IconUsers size={32} color="var(--mantine-color-orange-6)" />
            </Group>
          </Card>
        </Group>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onChange={value => setActiveTab(value || 'matrix')}
        >
          <Tabs.List>
            <Tabs.Tab value="matrix" leftSection={<IconMatrix size={16} />}>
              Role-Permission Matrix
            </Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              User Role Assignment
            </Tabs.Tab>
            <Tabs.Tab value="custom" leftSection={<IconSettings size={16} />}>
              Custom Roles
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="matrix" pt="md">
            <RolePermissionMatrix
              onRoleSelect={role => setSelectedRoleId(role.id)}
              selectedRoleId={selectedRoleId}
            />
          </Tabs.Panel>

          <Tabs.Panel value="users" pt="md">
            <UserRoleAssignment />
          </Tabs.Panel>

          <Tabs.Panel value="custom" pt="md">
            <CustomRoleCreation />
          </Tabs.Panel>
        </Tabs>

        {/* Help Section */}
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Permission Management Guide"
        >
          <Stack gap="xs">
            <Text size="sm">
              • Use the <strong>Role-Permission Matrix</strong> to manage which
              permissions each role has
            </Text>
            <Text size="sm">
              • Use <strong>User Role Assignment</strong> to assign roles to
              users and manage user access
            </Text>
            <Text size="sm">
              • Use <strong>Custom Roles</strong> to create specialized roles
              with specific permission combinations
            </Text>
            <Text size="sm">
              • Changes to permissions may affect multiple users - review impact
              analysis before confirming
            </Text>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  );
};
