import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconBuilding, IconAlertCircle } from '@tabler/icons-react';
import { z } from 'zod';
import { DepartmentSelect } from './DepartmentSelect';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartmentTree';
import { Department } from '../../../types';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  parentId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  department?: Department;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  parentId,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!department;
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const form = useForm<DepartmentFormData>({
    validate: zodResolver(departmentSchema),
    initialValues: {
      name: department?.name || '',
      description: department?.description || '',
      parentId: department?.parentId?.toString() || parentId?.toString() || '',
    },
  });

  const handleSubmit = async (values: DepartmentFormData) => {
    try {
      const departmentData = {
        name: values.name,
        description: values.description || undefined,
        parentId: values.parentId ? parseInt(values.parentId) : undefined,
      };

      if (isEditing) {
        await updateDepartment.mutateAsync({
          id: department.id,
          ...departmentData,
        });
      } else {
        await createDepartment.mutateAsync(departmentData);
      }

      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hooks
      console.error('Form submission error:', error);
    }
  };

  const isLoading = createDepartment.isPending || updateDepartment.isPending;
  const error = createDepartment.error || updateDepartment.error;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error.response?.data?.message || 'An error occurred while saving the department'}
          </Alert>
        )}

        <TextInput
          label="Department Name"
          placeholder="Enter department name"
          required
          leftSection={<IconBuilding size={16} />}
          {...form.getInputProps('name')}
        />

        <Textarea
          label="Description"
          placeholder="Enter department description (optional)"
          rows={3}
          {...form.getInputProps('description')}
        />

        <DepartmentSelect
          label="Parent Department"
          placeholder="Select parent department (optional)"
          includeRoot
          rootLabel="No Parent Department"
          excludeId={department?.id}
          {...form.getInputProps('parentId')}
        />

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="subtle" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            {isEditing ? 'Update Department' : 'Create Department'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};