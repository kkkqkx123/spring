/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { z } from 'zod';
import { DepartmentSelect } from './DepartmentSelect';
import { useMoveDepartment } from '../hooks/useDepartmentTree';
import { type Department } from '../../../types';

const moveSchema = z.object({
  newParentId: z.string().optional(),
});

type MoveFormData = z.infer<typeof moveSchema>;

interface DepartmentMoveDialogProps {
  opened: boolean;
  onClose: () => void;
  department: Department;
  onSuccess?: () => void;
}

export const DepartmentMoveDialog: React.FC<DepartmentMoveDialogProps> = ({
  opened,
  onClose,
  department,
  onSuccess,
}) => {
  const moveDepartment = useMoveDepartment();

  const form = useForm<MoveFormData>({
    validate: zodResolver(moveSchema),
    initialValues: {
      newParentId: department.parentId?.toString() || '',
    },
  });

  const handleSubmit = async (values: MoveFormData) => {
    try {
      await moveDepartment.mutateAsync({
        departmentId: department.id,
        newParentId: values.newParentId
          ? parseInt(values.newParentId)
          : undefined,
      });

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Move department error:', error);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  const isLoading = moveDepartment.isPending;
  const error = moveDepartment.error as any;

  // Get the current parent name for display
  const getCurrentParentName = () => {
    if (!department.parentId) return 'Root Level';
    // In a real implementation, you might want to fetch the parent department name
    return `Department ID: ${department.parentId}`;
  };

  const getNewParentName = () => {
    const newParentId = form.values.newParentId;
    if (!newParentId) return 'Root Level';
    // In a real implementation, you might want to fetch the new parent department name
    return `Department ID: ${newParentId}`;
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Move Department"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={isLoading} />

        <Stack gap="md">
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error.response?.data?.message ||
                'An error occurred while moving the department'}
            </Alert>
          )}

          <Alert color="blue" variant="light">
            <Text size="sm">
              Moving department: <strong>{department.name}</strong>
            </Text>
          </Alert>

          {/* Current and New Location */}
          {form.values.newParentId ===
          (department.parentId?.toString() || '') ? (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Current Location
              </Text>
              <Text size="sm" c="dimmed">
                {getCurrentParentName()}
              </Text>
            </Stack>
          ) : (
            <Alert color="green" variant="light">
              <Group gap="xs" align="center">
                <Text size="sm">{getCurrentParentName()}</Text>
                <IconArrowRight size={16} />
                <Text size="sm" fw={700}>
                  {getNewParentName()}
                </Text>
              </Group>
            </Alert>
          )}

          <DepartmentSelect
            label="New Parent Department"
            placeholder="Select new parent department"
            includeRoot
            rootLabel="Move to Root Level"
            excludeId={department.id}
            {...form.getInputProps('newParentId')}
          />
          {/* Warning for moving with children */}
          {department.children && department.children.length > 0 && (
            <Alert color="yellow" variant="light">
              <Text size="sm">
                This department has {department.children.length}{' '}
                subdepartment(s). Moving this department will also move all its
                subdepartments.
              </Text>
            </Alert>
          )}

          {/* Warning for moving with employees */}
          {department.employeeCount > 0 && (
            <Alert color="orange" variant="light">
              <Text size="sm">
                This department has {department.employeeCount} employee(s). They
                will remain in this department after the move.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={
                form.values.newParentId ===
                (department.parentId?.toString() || '')
              }
            >
              Move Department
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
