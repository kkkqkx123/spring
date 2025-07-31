import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Menu,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconDots,
  IconTrash,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { EmployeeList, useDeleteEmployees, useEmployeeExport } from '../index';
import { useAuth } from '../../../hooks/useAuth';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { usePositions } from '../../positions/hooks/usePositions';
import type { Employee } from '../../../types';

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [
    bulkDeleteModalOpened,
    { open: openBulkDeleteModal, close: closeBulkDeleteModal },
  ] = useDisclosure(false);

  // Queries and mutations
  const deleteEmployees = useDeleteEmployees();
  const exportEmployees = useEmployeeExport();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();

  // Permission checks
  const canCreate =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ||
    false;
  const canDelete =
    user?.roles.some(role => ['ADMIN'].includes(role.name)) || false;
  const canExport =
    user?.roles.some(role =>
      ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role.name)
    ) || false;

  const handleSelectionChange = (ids: number[]) => {
    setSelectedEmployees(ids);
  };

  const handleBulkDelete = async () => {
    try {
      await deleteEmployees.mutateAsync(selectedEmployees);
      notifications.show({
        title: 'Success',
        message: `${selectedEmployees.length} employees deleted successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setSelectedEmployees([]);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete employees',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      closeBulkDeleteModal();
    }
  };

  const handleExportSelected = async () => {
    if (selectedEmployees.length === 0) return;
    try {
      await exportEmployees.mutateAsync(selectedEmployees);
      notifications.show({
        title: 'Success',
        message: 'Selected employee data exported successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to export selected employee data',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleExportAll = async () => {
    try {
      await exportEmployees.mutateAsync(undefined); // Pass undefined to export all
      notifications.show({
        title: 'Success',
        message: 'All employee data exported successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to export all employee data',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="xl" fw={700} mb="xs">
              Employees
            </Text>
            <Text c="dimmed">Manage your organization's employees</Text>
          </div>

          <Group gap="sm">
            {/* Bulk Actions */}
            {selectedEmployees.length > 0 && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button leftSection={<IconDots size={16} />} variant="light">
                    Actions ({selectedEmployees.length})
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  {canExport && (
                    <Menu.Item
                      leftSection={<IconDownload size={14} />}
                      onClick={handleExportSelected}
                      disabled={exportEmployees.isPending}
                    >
                      Export Selected
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={openBulkDeleteModal}
                    >
                      Delete Selected
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}

            {/* Action Buttons */}
            {canExport && (
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={handleExportAll}
                loading={exportEmployees.isPending}
              >
                Export All
              </Button>
            )}

            <Button
              leftSection={<IconUpload size={16} />}
              variant="light"
              onClick={() => navigate('/employees/import')}
            >
              Import
            </Button>

            {canCreate && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate('/employees/new')}
              >
                Add Employee
              </Button>
            )}
          </Group>
        </Group>

        {/* Employee List Component */}
        <Card padding="lg" radius="md" withBorder>
          <EmployeeList
            onViewEmployee={(employee: Employee) =>
              navigate(`/employees/${employee.id}`)
            }
            onEditEmployee={(employee: Employee) =>
              navigate(`/employees/${employee.id}/edit`)
            }
            onSelectionChange={handleSelectionChange}
            departments={departments}
            positions={positions}
            selectedIds={selectedEmployees}
          />
        </Card>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          opened={bulkDeleteModalOpened}
          onClose={closeBulkDeleteModal}
          title="Confirm Bulk Deletion"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete{' '}
              <strong>{selectedEmployees.length}</strong> selected employees?
              This action cannot be undone.
            </Text>

            <Group justify="flex-end" gap="md">
              <Button
                variant="outline"
                onClick={closeBulkDeleteModal}
                disabled={deleteEmployees.isPending}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleBulkDelete}
                loading={deleteEmployees.isPending}
              >
                Delete {selectedEmployees.length} Employees
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default EmployeesPage;
