import React, { useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Grid,
  Modal,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { DepartmentTree, DepartmentForm } from '../components/index';
import { DepartmentDetail } from '../components/DepartmentDetail';
import { useDepartments } from '../hooks/useDepartments';
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useDepartmentTree';
import type { DepartmentCreateRequest } from '../services/departmentApi';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { useAuth } from '../../../hooks/useAuth';
import type { Department } from '../../../types';

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [creatingParentId, setCreatingParentId] = useState<number | null>(null);
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  // Queries and mutations
  const { isLoading, error, refetch } = useDepartments();

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  // Permission checks
  const canCreate =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ??
    false;
  const canEdit =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ??
    false;
  const canDelete =
    user?.roles.some(role => ['ADMIN'].includes(role.name)) ?? false;

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleOpenCreateModal = (parentId: number | null = null) => {
    setCreatingParentId(parentId);
    openCreateModal();
  };

  const handleCreateDepartment = async (data: DepartmentCreateRequest) => {
    try {
      const departmentData = creatingParentId
        ? { ...data, parentId: creatingParentId }
        : data;
      await createDepartment.mutateAsync(departmentData);
      notifications.show({
        title: 'Success',
        message: 'Department created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeCreateModal();
      setCreatingParentId(null);
      refetch();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to create department',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    openEditModal();
  };

  const handleUpdateDepartment = async (data: DepartmentCreateRequest) => {
    if (!editingDepartment) return;

    try {
      await updateDepartment.mutateAsync({
        id: editingDepartment.id,
        ...data,
      });
      notifications.show({
        title: 'Success',
        message: 'Department updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeEditModal();
      setEditingDepartment(null);
      refetch();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update department',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    openDeleteModal();
  };

  const confirmDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      await deleteDepartment.mutateAsync(selectedDepartment.id);
      notifications.show({
        title: 'Success',
        message: 'Department deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeDeleteModal();
      setSelectedDepartment(null);
      refetch();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete department',
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
          title="Error loading departments"
          color="red"
        >
          {error.message || 'Failed to load department data'}
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
              Departments
            </Text>
            <Text c="dimmed">
              Manage your organization's department structure
            </Text>
          </div>

          {canCreate && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleOpenCreateModal()}
            >
              Add Department
            </Button>
          )}
        </Group>

        {/* Department Tree */}
        <Grid>
          <Grid.Col span={{ base: 12, md: selectedDepartment ? 8 : 12 }}>
            <Card padding="lg" radius="md" withBorder>
              <Text fw={600} size="lg" mb="md">
                Department Hierarchy
              </Text>
              <DepartmentTree
                selectedDepartmentId={selectedDepartment?.id}
                onSelectDepartment={handleDepartmentSelect}
                onCreateDepartment={
                  canCreate ? handleOpenCreateModal : undefined
                }
                onEditDepartment={canEdit ? handleEditDepartment : undefined}
              />
            </Card>
          </Grid.Col>

          {selectedDepartment && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DepartmentDetail
                department={selectedDepartment}
                onEdit={handleEditDepartment}
                onDelete={handleDeleteDepartment}
                onClose={() => setSelectedDepartment(null)}
                onCreateChild={handleOpenCreateModal}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </Grid.Col>
          )}
        </Grid>

        {/* Create Department Modal */}
        <Modal
          opened={createModalOpened}
          onClose={() => {
            closeCreateModal();
            setCreatingParentId(null);
          }}
          title="Create New Department"
          size="md"
        >
          <DepartmentForm
            parentId={creatingParentId ?? undefined}
            onSuccess={handleCreateDepartment}
            onCancel={() => {
              closeCreateModal();
              setCreatingParentId(null);
            }}
            isLoading={createDepartment.isPending}
            error={createDepartment.error}
          />
        </Modal>

        {/* Edit Department Modal */}
        <Modal
          opened={editModalOpened}
          onClose={() => {
            closeEditModal();
            setEditingDepartment(null);
          }}
          title="Edit Department"
          size="md"
        >
          {editingDepartment && (
            <DepartmentForm
              department={editingDepartment}
              onSuccess={handleUpdateDepartment}
              onCancel={() => {
                closeEditModal();
                setEditingDepartment(null);
              }}
              isLoading={updateDepartment.isPending}
              error={updateDepartment.error}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="Confirm Deletion"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete the department{' '}
              <strong>{selectedDepartment?.name}</strong>?
              {selectedDepartment?.employeeCount &&
                selectedDepartment.employeeCount > 0 && (
                  <Text c="red" size="sm" mt="xs">
                    This department has {selectedDepartment.employeeCount}{' '}
                    employees. They will need to be reassigned to another
                    department.
                  </Text>
                )}
            </Text>

            <Group justify="flex-end" gap="md">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteDepartment.isPending}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={confirmDeleteDepartment}
                loading={deleteDepartment.isPending}
              >
                Delete Department
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default DepartmentsPage;
