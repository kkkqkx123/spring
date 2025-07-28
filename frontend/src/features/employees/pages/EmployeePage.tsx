import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Button,
  Group,
  Text,
  Alert,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import {
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/useEmployees';
import { EmployeeForm } from '../components/EmployeeForm';
import { EmployeeDetail } from '../components/EmployeeDetail';
import { ConfirmDialog } from '../../../components/ui';
import { LoadingSpinner } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { EmployeeCreateRequest, EmployeeUpdateRequest } from '../services/employeeApi';

type PageMode = 'view' | 'edit' | 'create';

export const EmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [mode, setMode] = useState<PageMode>(id ? 'view' : 'create');
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const employeeId = id ? parseInt(id) : 0;
  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';
  const isViewing = mode === 'view';

  // Queries and mutations
  const {
    data: employee,
    isLoading: employeeLoading,
    error: employeeError,
  } = useEmployee(employeeId);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Permission checks (simplified - in real app, check against user permissions)
  const canEdit = user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ?? false;
  const canDelete = user?.roles.some(role => ['ADMIN'].includes(role.name)) ?? false;

  const handleCreate = async (data: EmployeeCreateRequest) => {
    try {
      const newEmployee = await createEmployee.mutateAsync(data);
      notifications.show({
        title: 'Success',
        message: 'Employee created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      navigate(`/employees/${newEmployee.id}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create employee',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleUpdate = async (data: EmployeeUpdateRequest) => {
    if (!employee) return;
    
    try {
      await updateEmployee.mutateAsync({ id: employee.id, employee: data });
      notifications.show({
        title: 'Success',
        message: 'Employee updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setMode('view');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update employee',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    try {
      await deleteEmployee.mutateAsync(employee.id);
      notifications.show({
        title: 'Success',
        message: 'Employee deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      navigate('/employees');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete employee',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      closeDeleteModal();
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      navigate('/employees');
    } else {
      setMode('view');
    }
  };

  // Loading state
  if (employeeLoading && !isCreating) {
    return (
      <Container size="lg" py="xl">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  // Error state
  if (employeeError && !isCreating) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error loading employee"
          color="red"
        >
          {employeeError.message || 'Failed to load employee data'}
        </Alert>
      </Container>
    );
  }

  // Employee not found
  if (!employee && !isCreating && !employeeLoading) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Employee not found"
          color="red"
        >
          The requested employee could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group align="center" gap="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/employees')}
            >
              Back to Employees
            </Button>
            
            <Text size="xl" fw={700}>
              {isCreating
                ? 'Create New Employee'
                : isEditing
                ? 'Edit Employee'
                : 'Employee Details'}
            </Text>
          </Group>

          {/* Action buttons for view mode */}
          {isViewing && employee && (
            <Group gap="md">
              {canEdit && (
                <Button
                  variant="light"
                  onClick={() => setMode('edit')}
                >
                  Edit Employee
                </Button>
              )}
              
              {canDelete && (
                <Button
                  variant="light"
                  color="red"
                  onClick={openDeleteModal}
                >
                  Delete Employee
                </Button>
              )}
            </Group>
          )}
        </Group>

        {/* Content */}
        {(isCreating || isEditing) ? (
          <EmployeeForm
            employee={employee}
            onSubmit={isCreating ? handleCreate : handleUpdate}
            onCancel={handleCancel}
            loading={createEmployee.isPending || updateEmployee.isPending}
          />
        ) : (
          employee && (
            <EmployeeDetail
              employee={employee}
              onEdit={() => setMode('edit')}
              onDelete={openDeleteModal}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="Confirm Deletion"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete{' '}
              <strong>
                {employee?.firstName} {employee?.lastName}
              </strong>
              ? This action cannot be undone.
            </Text>
            
            <Group justify="flex-end" gap="md">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteEmployee.isPending}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDelete}
                loading={deleteEmployee.isPending}
              >
                Delete Employee
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};