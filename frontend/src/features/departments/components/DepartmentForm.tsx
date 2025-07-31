/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { Department } from '../../../types';

// Helper to extract error message
const getErrorMessage = (error: any): string | null => {
  if (!error) return null;
  if (typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return 'An error occurred while saving the department';
};

const departmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Department name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  parentId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  department?: Department;
  parentId?: number;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: any;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  parentId,
  onSuccess,
  onCancel,
  isLoading,
  error,
}) => {
  const isEditing = !!department;

  const form = useForm<DepartmentFormData>({
    validate: zodResolver(departmentSchema),
    initialValues: {
      name: department?.name || '',
      description: department?.description || '',
      parentId: department?.parentId?.toString() || parentId?.toString() || '',
    },
  });

  const handleSubmit = (values: DepartmentFormData) => {
    const departmentData = {
      name: values.name,
      description: values.description || undefined,
      parentId: values.parentId ? parseInt(values.parentId) : undefined,
    };
    onSuccess?.(departmentData);
  };

  const errorMessage = getErrorMessage(error);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <LoadingOverlay visible={isLoading} />

      <Stack gap="md">
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            {errorMessage}
          </Alert>
        )}

        <TextInput
          label="Department Name"
          placeholder="Enter department name"
          required
          leftSection={<IconBuilding size={16} />}
          {...form.getInputProps('name')}
          error={form.errors.name}
        />

        <Textarea
          label="Description"
          placeholder="Enter department description (optional)"
          rows={3}
          {...form.getInputProps('description')}
          error={form.errors.description}
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
