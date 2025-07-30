import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Tabs,
  ActionIcon,
  Menu,
  Modal,
  Alert,
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
  IconGrid3x3,
  IconList,
} from '@tabler/icons-react';
import {
  EmployeeList,
  EmployeeSearch,
  useEmployees,
  useDeleteEmployees,
  useEmployeeExport,
} from '../index';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { useAuth } from '../../../hooks/useAuth';

type ViewMode = 'list' | 'grid';

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [searchCriteria, setSearchCriteria] = useState({});
  const [
    bulkDeleteModalOpened,
    { open: openBulkDeleteModal, close: closeBulkDeleteModal },
  ] = useDisclosure(false);

  // Queries and mutations
  const {
    data: employeesData,
    isLoading,
    error,
    refetch,
  } = useEmployees({
    page: 0,
    size: 20,
    ...searchCriteria,
  });

  const deleteEmployees = useDeleteEmployees();
  const exportEmployees = useEmployeeExport();

  // Permission checks
  const canCreate =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ??
    false;
  const canDelete =
    user?.roles.some(role => ['ADMIN'].includes(role.name)) ?? false;
  const canExport =
    user?.roles.some(role =>
      ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role.name)
    ) ?? false;

  const handleSearch = (criteria: any) => {
    setSearchCriteria(criteria);
  };

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
      refetch();
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

  const handleExport = async () => {
    try {
      await exportEmployees.mutateAsync({
        employeeIds:
          selectedEmployees.length > 0 ? selectedEmployees : undefined,
        format: 'xlsx',
      });
      notifications.show({
        title: 'Success',
        message: 'Employee data exported successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to export employee data',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading employees"
          color="red"
        >
          {error.message || 'Failed to load employee data'}
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
              Employees
            </Text>
            <Text c="dimmed">Manage your organization's employees</Text>
          </div>

          <Group gap="sm">
            {/* View Mode Toggle */}
            <Group gap={0}>
              <ActionIcon
                variant={viewMode === 'list' ? 'filled' : 'light'}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <IconList size={16} />
              </ActionIcon>
              <ActionIcon
                variant={viewMode === 'grid' ? 'filled' : 'light'}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <IconGrid3x3 size={16} />
              </ActionIcon>
            </Group>

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
                      onClick={handleExport}
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
                onClick={handleExport}
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

        {/* Search */}
        <Card padding="lg" radius="md" withBorder>
          <EmployeeSearch onSearch={handleSearch} />
        </Card>

        {/* Employee List */}
        <Card padding="lg" radius="md" withBorder>
          <EmployeeList
            employees={employeesData?.content || []}
            totalElements={employeesData?.totalElements || 0}
            viewMode={viewMode}
            selectedIds={selectedEmployees}
            onSelectionChange={handleSelectionChange}
            onEmployeeClick={employee => navigate(`/employees/${employee.id}`)}
            loading={isLoading}
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
