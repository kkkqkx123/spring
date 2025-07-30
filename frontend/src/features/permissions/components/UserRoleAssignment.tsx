import React, { useState } from 'react';
import {
  Card,
  Title,
  Stack,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Text,
  TextInput,
  Select,
  MultiSelect,
  Modal,
  Alert,
  Pagination,
  LoadingOverlay,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconSearch,
  IconUserPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  useUsersWithRoles,
  useAllRoles,
  useAssignUserRoles,
  useRemoveUserRole,
  useBulkAssignRoles,
  useBulkRemoveRoles,
} from '../hooks/usePermissions';
import type { User, Role } from '../../../types';

interface UserRoleAssignmentProps {
  selectedUsers?: number[];
  onUserSelect?: (userId: number) => void;
}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  selectedUsers = [],
  onUserSelect,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [bulkRoleIds, setBulkRoleIds] = useState<number[]>([]);

  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  const [
    assignModalOpened,
    { open: openAssignModal, close: closeAssignModal },
  ] = useDisclosure(false);
  const [bulkModalOpened, { open: openBulkModal, close: closeBulkModal }] =
    useDisclosure(false);

  const { data: usersData, isLoading: usersLoading } = useUsersWithRoles({
    page: page - 1,
    size: pageSize,
    sort: 'username,asc',
  });

  const { data: roles = [] } = useAllRoles();
  const assignUserRoles = useAssignUserRoles();
  const removeUserRole = useRemoveUserRole();
  const bulkAssignRoles = useBulkAssignRoles();
  const bulkRemoveRoles = useBulkRemoveRoles();

  const users = usersData?.content || [];
  const totalUsers = usersData?.totalElements || 0;
  const totalPages = usersData?.totalPages || 1;

  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
    onUserSelect?.(userId);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    openAssignModal();
  };

  const handleAssignRoles = async (roleIds: number[]) => {
    if (editingUser) {
      await assignUserRoles.mutateAsync({
        userId: editingUser.id,
        roleIds,
      });
      closeAssignModal();
      setEditingUser(null);
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    if (
      window.confirm('Are you sure you want to remove this role from the user?')
    ) {
      await removeUserRole.mutateAsync({ userId, roleId });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUserIds.length > 0 && bulkRoleIds.length > 0) {
      await bulkAssignRoles.mutateAsync({
        userIds: selectedUserIds,
        roleIds: bulkRoleIds,
      });
      closeBulkModal();
      setBulkRoleIds([]);
      setSelectedUserIds([]);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedUserIds.length > 0 && bulkRoleIds.length > 0) {
      if (
        window.confirm(
          `Are you sure you want to remove the selected roles from ${selectedUserIds.length} user(s)?`
        )
      ) {
        await bulkRemoveRoles.mutateAsync({
          userIds: selectedUserIds,
          roleIds: bulkRoleIds,
        });
        closeBulkModal();
        setBulkRoleIds([]);
        setSelectedUserIds([]);
      }
    }
  };

  const roleOptions = roles.map(role => ({
    value: role.id.toString(),
    label: role.name,
  }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>User Role Assignment</Title>
        <Group>
          {selectedUserIds.length > 0 && (
            <Button
              variant="light"
              leftSection={<IconUsers size={16} />}
              onClick={openBulkModal}
            >
              Bulk Actions ({selectedUserIds.length})
            </Button>
          )}
        </Group>
      </Group>

      <Card>
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Search users..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={event => setSearchTerm(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
          </Group>

          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={usersLoading} />

            {users.length === 0 ? (
              <Alert icon={<IconInfoCircle size={16} />} title="No users found">
                {debouncedSearch
                  ? 'No users match your search criteria.'
                  : 'No users available.'}
              </Alert>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Checkbox
                        checked={selectedUserIds.length === users.length}
                        indeterminate={
                          selectedUserIds.length > 0 &&
                          selectedUserIds.length < users.length
                        }
                        onChange={event =>
                          handleSelectAll(event.currentTarget.checked)
                        }
                      />
                    </Table.Th>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Roles</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onChange={event =>
                            handleUserSelection(
                              user.id,
                              event.currentTarget.checked
                            )
                          }
                        />
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={500}>{user.username}</Text>
                          {(user.firstName || user.lastName) && (
                            <Text size="sm" c="dimmed">
                              {[user.firstName, user.lastName]
                                .filter(Boolean)
                                .join(' ')}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{user.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {user.roles.map(role => (
                            <Badge
                              key={role.id}
                              variant="light"
                              size="sm"
                              rightSection={
                                <ActionIcon
                                  size="xs"
                                  color="red"
                                  variant="transparent"
                                  onClick={() =>
                                    handleRemoveRole(user.id, role.id)
                                  }
                                >
                                  <IconTrash size={10} />
                                </ActionIcon>
                              }
                            >
                              {role.name}
                            </Badge>
                          ))}
                          {user.roles.length === 0 && (
                            <Text size="sm" c="dimmed">
                              No roles assigned
                            </Text>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={user.enabled ? 'green' : 'red'}
                          variant="light"
                        >
                          {user.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Edit roles">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleEditUser(user)}
                            >
                              <IconEdit size={16} />
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

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      </Card>

      {/* Individual User Role Assignment Modal */}
      <Modal
        opened={assignModalOpened}
        onClose={closeAssignModal}
        title={`Assign Roles - ${editingUser?.username}`}
        size="md"
      >
        {editingUser && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Select roles to assign to {editingUser.username}
            </Text>

            <MultiSelect
              data={roleOptions}
              value={editingUser.roles.map(role => role.id.toString())}
              onChange={values =>
                handleAssignRoles(values.map(v => parseInt(v, 10)))
              }
              placeholder="Select roles"
              searchable
              clearable
            />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeAssignModal}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleAssignRoles(editingUser.roles.map(r => r.id))
                }
                loading={assignUserRoles.isPending}
              >
                Update Roles
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Bulk Role Assignment Modal */}
      <Modal
        opened={bulkModalOpened}
        onClose={closeBulkModal}
        title={`Bulk Role Management - ${selectedUserIds.length} user(s)`}
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />}>
            You have selected {selectedUserIds.length} user(s) for bulk role
            management.
          </Alert>

          <MultiSelect
            label="Select Roles"
            data={roleOptions}
            value={bulkRoleIds.map(id => id.toString())}
            onChange={values =>
              setBulkRoleIds(values.map(v => parseInt(v, 10)))
            }
            placeholder="Select roles to assign or remove"
            searchable
            clearable
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeBulkModal}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleBulkRemove}
              loading={bulkRemoveRoles.isPending}
              disabled={bulkRoleIds.length === 0}
            >
              Remove Roles
            </Button>
            <Button
              onClick={handleBulkAssign}
              loading={bulkAssignRoles.isPending}
              disabled={bulkRoleIds.length === 0}
            >
              Assign Roles
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
