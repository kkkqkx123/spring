import React from 'react';
import { Stack, Title, Button, Group, Card, Text, Badge } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import {
  PermissionGuard,
  RoleGuard,
  CrudGuard,
  AdminGuard,
  withPermission,
  withAdminPermission,
  withCrudPermission,
} from '../access-control';
import {
  useAccessControl,
  usePermissionCheck,
  useRoleCheck,
  useResourcePermissions,
} from '../../hooks/useAccessControl';

// Example component demonstrating permission-based UI rendering
export const AccessControlExample: React.FC = () => {
  const {
    isAdmin,
    isManager,
    userPermissions,
    userRoles,
    hasPermission,
    hasRole,
  } = useAccessControl();

  // Hook-based permission checks
  const canReadEmployees = usePermissionCheck('EMPLOYEE_READ');
  const canCreateEmployees = usePermissionCheck('EMPLOYEE_CREATE');
  const isManagerRole = useRoleCheck('MANAGER');
  const employeePermissions = useResourcePermissions('employee');

  return (
    <Stack gap="lg">
      <Title order={2}>Access Control Examples</Title>

      {/* User Information */}
      <Card withBorder>
        <Title order={3}>Current User Information</Title>
        <Group gap="md" mt="md">
          <Badge color={isAdmin ? 'red' : 'gray'}>
            Admin: {isAdmin ? 'Yes' : 'No'}
          </Badge>
          <Badge color={isManager ? 'blue' : 'gray'}>
            Manager: {isManager ? 'Yes' : 'No'}
          </Badge>
        </Group>
        <Text size="sm" mt="md">
          <strong>Roles:</strong> {userRoles.join(', ') || 'None'}
        </Text>
        <Text size="sm">
          <strong>Permissions:</strong> {userPermissions.slice(0, 5).join(', ')}
          {userPermissions.length > 5 &&
            ` ... and ${userPermissions.length - 5} more`}
        </Text>
      </Card>

      {/* Permission Guard Examples */}
      <Card withBorder>
        <Title order={3}>Permission Guard Examples</Title>
        <Stack gap="md" mt="md">
          {/* Single permission check */}
          <PermissionGuard permission="EMPLOYEE_READ">
            <Button
              leftSection={<IconEye size={16} />}
              variant="light"
              color="blue"
            >
              View Employees (EMPLOYEE_READ required)
            </Button>
          </PermissionGuard>

          {/* Multiple permissions (any) */}
          <PermissionGuard
            permissions={['EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE']}
            requireAll={false}
          >
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              color="green"
            >
              Modify Employees (CREATE or UPDATE required)
            </Button>
          </PermissionGuard>

          {/* Multiple permissions (all) */}
          <PermissionGuard
            permissions={['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']}
            requireAll={true}
            fallback={
              <Text size="sm" c="dimmed">
                You need both READ and UPDATE permissions to see this button
              </Text>
            }
          >
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              color="orange"
            >
              Edit Employee Details (READ and UPDATE required)
            </Button>
          </PermissionGuard>
        </Stack>
      </Card>

      {/* Role Guard Examples */}
      <Card withBorder>
        <Title order={3}>Role Guard Examples</Title>
        <Stack gap="md" mt="md">
          <RoleGuard role="ADMIN">
            <Button variant="light" color="red">
              Admin Only Button
            </Button>
          </RoleGuard>

          <RoleGuard
            roles={['ADMIN', 'MANAGER']}
            requireAll={false}
            fallback={
              <Text size="sm" c="dimmed">
                Manager or Admin access required
              </Text>
            }
          >
            <Button variant="light" color="blue">
              Management Functions
            </Button>
          </RoleGuard>
        </Stack>
      </Card>

      {/* CRUD Guard Examples */}
      <Card withBorder>
        <Title order={3}>CRUD Guard Examples</Title>
        <Group gap="md" mt="md">
          <CrudGuard resource="employee" action="create">
            <Button leftSection={<IconPlus size={16} />} color="green">
              Create Employee
            </Button>
          </CrudGuard>

          <CrudGuard resource="employee" action="read">
            <Button leftSection={<IconEye size={16} />} color="blue">
              View Employees
            </Button>
          </CrudGuard>

          <CrudGuard resource="employee" action="update">
            <Button leftSection={<IconEdit size={16} />} color="orange">
              Edit Employee
            </Button>
          </CrudGuard>

          <CrudGuard resource="employee" action="delete">
            <Button leftSection={<IconTrash size={16} />} color="red">
              Delete Employee
            </Button>
          </CrudGuard>

          <CrudGuard
            resource="employee"
            action="any"
            fallback={
              <Text size="sm" c="dimmed">
                No employee access
              </Text>
            }
          >
            <Button variant="outline">Any Employee Action</Button>
          </CrudGuard>
        </Group>
      </Card>

      {/* Admin Guard Example */}
      <Card withBorder>
        <Title order={3}>Admin Guard Example</Title>
        <AdminGuard>
          <Button variant="filled" color="red">
            Super Admin Function
          </Button>
        </AdminGuard>
      </Card>

      {/* Hook-based Examples */}
      <Card withBorder>
        <Title order={3}>Hook-based Permission Checks</Title>
        <Stack gap="md" mt="md">
          <Group gap="md">
            <Badge color={canReadEmployees ? 'green' : 'red'}>
              Can Read Employees: {canReadEmployees ? 'Yes' : 'No'}
            </Badge>
            <Badge color={canCreateEmployees ? 'green' : 'red'}>
              Can Create Employees: {canCreateEmployees ? 'Yes' : 'No'}
            </Badge>
            <Badge color={isManagerRole ? 'green' : 'red'}>
              Is Manager: {isManagerRole ? 'Yes' : 'No'}
            </Badge>
          </Group>

          <Text size="sm">
            <strong>Employee Resource Permissions:</strong>
          </Text>
          <Group gap="xs">
            <Badge
              color={employeePermissions.create ? 'green' : 'red'}
              size="sm"
            >
              Create: {employeePermissions.create ? '✓' : '✗'}
            </Badge>
            <Badge color={employeePermissions.read ? 'green' : 'red'} size="sm">
              Read: {employeePermissions.read ? '✓' : '✗'}
            </Badge>
            <Badge
              color={employeePermissions.update ? 'green' : 'red'}
              size="sm"
            >
              Update: {employeePermissions.update ? '✓' : '✗'}
            </Badge>
            <Badge
              color={employeePermissions.delete ? 'green' : 'red'}
              size="sm"
            >
              Delete: {employeePermissions.delete ? '✓' : '✗'}
            </Badge>
          </Group>

          {/* Conditional rendering based on hooks */}
          {hasPermission('EMPLOYEE_CREATE') && (
            <Button leftSection={<IconPlus size={16} />} color="green">
              Hook-based Create Button
            </Button>
          )}

          {hasRole('ADMIN') && (
            <Button color="red">Hook-based Admin Button</Button>
          )}
        </Stack>
      </Card>

      {/* Programmatic Permission Validation */}
      <Card withBorder>
        <Title order={3}>Programmatic Actions</Title>
        <Group gap="md" mt="md">
          <Button
            onClick={() => {
              if (hasPermission('EMPLOYEE_DELETE')) {
                alert('Delete action would be performed');
              } else {
                alert('You do not have permission to delete employees');
              }
            }}
          >
            Try Delete Action
          </Button>

          <Button
            onClick={() => {
              if (hasRole('ADMIN')) {
                alert('Admin action would be performed');
              } else {
                alert('Admin role required');
              }
            }}
          >
            Try Admin Action
          </Button>
        </Group>
      </Card>
    </Stack>
  );
};

// Example of HOC usage
const AdminOnlyComponent: React.FC = () => (
  <Card withBorder p="md">
    <Text>This component is only visible to admins</Text>
    <Button color="red" mt="md">
      Admin Function
    </Button>
  </Card>
);

const EmployeeCreateComponent: React.FC = () => (
  <Card withBorder p="md">
    <Text>This component requires EMPLOYEE_CREATE permission</Text>
    <Button color="green" mt="md">
      Create Employee
    </Button>
  </Card>
);

// Wrapped components using HOCs
export const AdminOnlyWrapped = withAdminPermission(AdminOnlyComponent);
export const EmployeeCreateWrapped = withCrudPermission(
  EmployeeCreateComponent,
  'employee',
  'create'
);
export const ManagerOnlyWrapped = withPermission(AdminOnlyComponent, {
  roles: ['ADMIN', 'MANAGER'],
  requireAll: false,
});

export default AccessControlExample;
