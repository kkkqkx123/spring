import React, { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  ActionIcon,
  Text,
  SegmentedControl,
  Menu,
  SimpleGrid,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconTrash,
  IconList,
  IconGrid3x3,
  IconDots,
  IconAlertCircle,
} from '@tabler/icons-react';
import { ResponsiveDataTable } from '../../../components/ui/ResponsiveDataTable';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmployeeSearch } from './EmployeeSearch';
import { EmployeeCard } from './EmployeeCard';
import {
  useEmployees,
  useEmployeeSearch,
  useDeleteEmployees,
  useEmployeeExport,
  useEmployeeListState,
} from '../hooks/useEmployees';
import type {
  Employee,
  Department,
  Position,
  DataTableColumn,
} from '../../../types';

interface EmployeeListProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  departments: Department[];
  positions: Position[];
  onCreateEmployee?: () => void;
  onEditEmployee?: (employee: Employee) => void;
  onViewEmployee?: (employee: Employee) => void;
  onImportEmployees?: () => void;
  onExportEmployees?: () => void;
}

type ViewMode = 'table' | 'grid';

export const EmployeeList: React.FC<EmployeeListProps> = ({
  selectedIds,
  onSelectionChange,
  departments,
  positions,
  onCreateEmployee,
  onEditEmployee,
  onViewEmployee,
  onImportEmployees,
  onExportEmployees,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [
    deleteModalOpened,
    { open: openBulkDeleteModal, close: closeBulkDeleteModal },
  ] = useDisclosure(false);

  const {
    pageable,
    searchCriteria,
    updatePageable,
    updateSearchCriteria,
    clearSearch,
  } = useEmployeeListState();

  // Determine if we should use search or regular list query
  const hasSearchCriteria = Object.keys(searchCriteria).length > 0;

  const {
    data: employeeData,
    isLoading: isLoadingEmployees,
    error: employeeError,
  } = useEmployees(pageable);

  const {
    data: searchData,
    isLoading: isLoadingSearch,
    error: searchError,
  } = useEmployeeSearch(searchCriteria, pageable);

  const deleteEmployeesMutation = useDeleteEmployees();
  const exportEmployeesMutation = useEmployeeExport();

  // Use search data if available, otherwise use regular employee data
  const currentData = hasSearchCriteria ? searchData : employeeData;
  const isLoading = hasSearchCriteria ? isLoadingSearch : isLoadingEmployees;
  const error = hasSearchCriteria ? searchError : employeeError;

  const employees = currentData?.content || [];
  const totalElements = currentData?.totalElements || 0;

  const handlePageChange = (page: number, pageSize: number) => {
    updatePageable({ page: page - 1, size: pageSize }); // Convert to 0-based indexing
  };

  const handleRowSelection = (
    _selectedRowKeys: React.Key[],
    selectedRows: Employee[]
  ) => {
    onSelectionChange(selectedRows.map(emp => emp.id));
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteEmployeesMutation.mutateAsync(selectedIds);
      notifications.show({
        title: 'Success',
        message: `${selectedIds.length} employee(s) deleted successfully`,
        color: 'green',
      });
      onSelectionChange([]);
      closeBulkDeleteModal();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete employees',
        color: 'red',
      });
    }
  };

  const handleExportSelected = async () => {
    try {
      const blob = await exportEmployeesMutation.mutateAsync(
        selectedIds.length > 0 ? selectedIds : undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Success',
        message: 'Employees exported successfully',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to export employees',
        color: 'red',
      });
    }
  };

  const tableColumns: DataTableColumn<Employee>[] = [
    {
      key: 'employeeNumber',
      title: 'Employee #',
      sortable: true,
    },
    {
      key: 'firstName',
      title: 'First Name',
      sortable: true,
    },
    {
      key: 'lastName',
      title: 'Last Name',
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      render: (_, record) => record.department.name,
    },
    {
      key: 'position',
      title: 'Position',
      sortable: true,
      render: (_, record) => record.position.title,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (_, record) => (
        <Text
          size="sm"
          c={
            record.status === 'ACTIVE'
              ? 'green'
              : record.status === 'INACTIVE'
                ? 'yellow'
                : 'red'
          }
          fw={500}
        >
          {record.status}
        </Text>
      ),
    },
    {
      key: 'id', // Use a valid key like 'id' for the actions column
      title: 'Actions',
      render: (_, record) => (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {onViewEmployee && (
              <Menu.Item onClick={() => onViewEmployee(record)}>
                View Details
              </Menu.Item>
            )}
            {onEditEmployee && (
              <Menu.Item onClick={() => onEditEmployee(record)}>Edit</Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        Failed to load employees. Please try again.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {/* Search Component */}
      <EmployeeSearch
        onSearch={updateSearchCriteria}
        onClear={clearSearch}
        departments={departments}
        positions={positions}
        loading={isLoading}
        initialValues={searchCriteria}
      />

      {/* Actions Bar */}
      <Group justify="space-between">
        <Group gap="sm">
          {onCreateEmployee && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onCreateEmployee}
            >
              Add Employee
            </Button>
          )}

          {selectedIds.length > 0 && (
            <>
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={openBulkDeleteModal}
              >
                Delete ({selectedIds.length})
              </Button>

              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={handleExportSelected}
                loading={exportEmployeesMutation.isPending}
              >
                Export Selected
              </Button>
            </>
          )}

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="light" leftSection={<IconDots size={16} />}>
                More Actions
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {onImportEmployees && (
                <Menu.Item
                  leftSection={<IconUpload size={16} />}
                  onClick={onImportEmployees}
                >
                  Import Employees
                </Menu.Item>
              )}
              <Menu.Item
                leftSection={<IconDownload size={16} />}
                onClick={onExportEmployees || handleExportSelected}
                disabled={exportEmployeesMutation.isPending}
              >
                Export All
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="sm">
          <Text size="sm" c="dimmed">
            {totalElements} employee{totalElements !== 1 ? 's' : ''}
          </Text>

          <SegmentedControl
            value={viewMode}
            onChange={value => setViewMode(value as ViewMode)}
            data={[
              { label: <IconList size={16} />, value: 'table' },
              { label: <IconGrid3x3 size={16} />, value: 'grid' },
            ]}
            size="sm"
          />
        </Group>
      </Group>

      {/* Content */}
      {isLoading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader size="md" />
            <Text size="sm" c="dimmed">
              Loading employees...
            </Text>
          </Stack>
        </Center>
      ) : viewMode === 'table' ? (
        <ResponsiveDataTable
          data={employees}
          columns={tableColumns}
          loading={isLoading}
          pagination={{
            current: pageable.page + 1, // Convert from 0-based indexing
            pageSize: pageable.size,
            total: totalElements,
            onChange: handlePageChange,
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: handleRowSelection,
          }}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {employees.map(employee => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              selected={selectedIds.includes(employee.id)}
              onSelect={selected => {
                if (selected) {
                  onSelectionChange([...selectedIds, employee.id]);
                } else {
                  onSelectionChange(
                    selectedIds.filter(id => id !== employee.id)
                  );
                }
              }}
              onView={onViewEmployee}
              onEdit={onEditEmployee}
              selectable
            />
          ))}
        </SimpleGrid>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        opened={deleteModalOpened}
        onClose={closeBulkDeleteModal}
        onConfirm={handleDeleteSelected}
        title="Delete Employees"
        message={`Are you sure you want to delete ${selectedIds.length} employee(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteEmployeesMutation.isPending}
      />
    </Stack>
  );
};
