import React, { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Paper,
  Divider,
  Alert,
  Center,
  Loader,
  Modal,
  Tabs,
  SimpleGrid,
  Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuilding,
  IconUsers,
  IconEdit,
  IconTrash,
  IconPlus,
  IconAlertCircle,
  IconCalendar,
  IconHierarchy,
} from '@tabler/icons-react';
import { useDepartment, useDeleteDepartment, useDepartmentEmployees } from '../hooks/useDepartmentTree';
import { DepartmentForm } from './DepartmentForm';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Department } from '../../../types';

interface DepartmentDetailProps {
  departmentId: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreateChild?: () => void;
  onClose?: () => void;
}

interface EmployeeCardProps {
  employee: any; // Using any since we don't have the full Employee type in this context
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => (
  <Card withBorder p="sm">
    <Group justify="space-between" wrap="nowrap">
      <div>
        <Text size="sm" fw={500}>
          {employee.firstName} {employee.lastName}
        </Text>
        <Text size="xs" c="dimmed">
          {employee.email}
        </Text>
        {employee.position && (
          <Text size="xs" c="blue">
            {employee.position.title}
          </Text>
        )}
      </div>
      <Badge size="sm" variant="light">
        {employee.status}
      </Badge>
    </Group>
  </Card>
);

export const DepartmentDetail: React.FC<DepartmentDetailProps> = ({
  departmentId,
  onEdit,
  onDelete,
  onCreateChild,
  onClose,
}) => {
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [deleteDialogOpened, setDeleteDialogOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  const { data: department, isLoading, error } = useDepartment(departmentId);
  const { data: employees, isLoading: employeesLoading } = useDepartmentEmployees(departmentId);
  const deleteDepartment = useDeleteDepartment();

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      openEditModal();
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpened(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDepartment.mutateAsync(departmentId);
      setDeleteDialogOpened(false);
      onDelete?.();
      onClose?.();
    } catch (error) {
      // Error handling is done in the hook
      setDeleteDialogOpened(false);
    }
  };

  const handleEditSuccess = () => {
    closeEditModal();
  };

  if (isLoading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (error || !department) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        Failed to load department details. Please try again.
      </Alert>
    );
  }

  const canDelete = department.employeeCount === 0 && (!department.children || department.children.length === 0);

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <IconBuilding size={24} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xl" fw={600}>
                {department.name}
              </Text>
              {department.description && (
                <Text size="sm" c="dimmed">
                  {department.description}
                </Text>
              )}
            </div>
          </Group>
          <Group gap="xs">
            <ActionIcon variant="light" onClick={handleEdit}>
              <IconEdit size={16} />
            </ActionIcon>
            {onCreateChild && (
              <ActionIcon variant="light" onClick={onCreateChild}>
                <IconPlus size={16} />
              </ActionIcon>
            )}
            <ActionIcon
              variant="light"
              color="red"
              onClick={handleDelete}
              disabled={!canDelete}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Quick Stats */}
        <SimpleGrid cols={3} spacing="md">
          <Paper withBorder p="md" radius="md">
            <Group gap="xs">
              <IconUsers size={20} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Employees
                </Text>
                <Text size="lg" fw={600}>
                  {department.employeeCount}
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group gap="xs">
              <IconHierarchy size={20} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Subdepartments
                </Text>
                <Text size="lg" fw={600}>
                  {department.children?.length || 0}
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group gap="xs">
              <IconCalendar size={20} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Created
                </Text>
                <Text size="lg" fw={600}>
                  {new Date(department.createdAt).toLocaleDateString()}
                </Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="employees">
              Employees ({department.employeeCount})
            </Tabs.Tab>
            {department.children && department.children.length > 0 && (
              <Tabs.Tab value="subdepartments">
                Subdepartments ({department.children.length})
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <Paper withBorder p="md">
                <Stack gap="sm">
                  <Text fw={500}>Department Information</Text>
                  <Divider />
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Name:
                    </Text>
                    <Text size="sm">{department.name}</Text>
                  </Group>
                  {department.description && (
                    <Group align="flex-start">
                      <Text size="sm" c="dimmed" w={120}>
                        Description:
                      </Text>
                      <Text size="sm" style={{ flex: 1 }}>
                        {department.description}
                      </Text>
                    </Group>
                  )}
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Parent:
                    </Text>
                    <Text size="sm">
                      {department.parentId ? 'Has Parent' : 'Root Department'}
                    </Text>
                  </Group>
                  <Group>
                    <Text size="sm" c="dimmed" w={120}>
                      Created:
                    </Text>
                    <Text size="sm">
                      {new Date(department.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="employees" pt="md">
            {employeesLoading ? (
              <Center p="xl">
                <Loader size="md" />
              </Center>
            ) : employees && employees.length > 0 ? (
              <SimpleGrid cols={2} spacing="md">
                {employees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </SimpleGrid>
            ) : (
              <Paper withBorder p="xl">
                <Center>
                  <Stack align="center" gap="md">
                    <IconUsers size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed">No employees in this department</Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Tabs.Panel>

          {department.children && department.children.length > 0 && (
            <Tabs.Panel value="subdepartments" pt="md">
              <SimpleGrid cols={2} spacing="md">
                {department.children.map((child) => (
                  <Card key={child.id} withBorder p="md">
                    <Group justify="space-between" wrap="nowrap">
                      <div>
                        <Text fw={500}>{child.name}</Text>
                        {child.description && (
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {child.description}
                          </Text>
                        )}
                      </div>
                      <Badge size="sm" variant="light">
                        {child.employeeCount} employees
                      </Badge>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Tabs.Panel>
          )}
        </Tabs>

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          {onClose && (
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
          )}
          <Button variant="light" leftSection={<IconEdit size={16} />} onClick={handleEdit}>
            Edit Department
          </Button>
          {onCreateChild && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateChild}>
              Add Subdepartment
            </Button>
          )}
        </Group>
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Department"
        size="md"
      >
        <DepartmentForm
          department={department}
          onSuccess={handleEditSuccess}
          onCancel={closeEditModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        opened={deleteDialogOpened}
        onClose={() => setDeleteDialogOpened(false)}
        onConfirm={confirmDelete}
        title="Delete Department"
        message={
          canDelete
            ? `Are you sure you want to delete "${department.name}"? This action cannot be undone.`
            : `Cannot delete "${department.name}" because it contains employees or subdepartments. Please move or remove them first.`
        }
        confirmLabel="Delete"
        confirmColor="red"
        confirmDisabled={!canDelete}
      />
    </>
  );
};