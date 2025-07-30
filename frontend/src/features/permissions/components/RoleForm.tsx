import React from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  MultiSelect,
  Button,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { Role, Permission } from '../../../types';

interface RoleFormProps {
  role?: Role | null;
  permissions: Permission[];
  onSubmit: (data: {
    name: string;
    description?: string;
    permissionIds: number[];
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  permissions,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const form = useForm({
    initialValues: {
      name: role?.name || '',
      description: role?.permissions?.map(p => p.description).join(', ') || '',
      permissionIds: role?.permissions?.map(p => p.id) || [],
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Role name is required';
        if (value.length < 2) return 'Role name must be at least 2 characters';
        if (value.length > 50) return 'Role name must be less than 50 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 255) {
          return 'Description must be less than 255 characters';
        }
        return null;
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      permissionIds: values.permissionIds,
    });
  };

  // Group permissions by category for better UX
  const permissionOptions = React.useMemo(() => {
    const groups: Record<string, { value: string; label: string; group: string }[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.name.split(':')[0] || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push({
        value: permission.id.toString(),
        label: `${permission.name.split(':').pop()} ${permission.description ? `- ${permission.description}` : ''}`,
        group: category,
      });
    });

    // Flatten and sort by group
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([group, items]) => 
        items.map(item => ({ ...item, group }))
      );
  }, [permissions]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Role Name"
          placeholder="Enter role name"
          required
          {...form.getInputProps('name')}
          disabled={loading}
        />

        <Textarea
          label="Description"
          placeholder="Enter role description (optional)"
          rows={3}
          {...form.getInputProps('description')}
          disabled={loading}
        />

        <Divider />

        <div>
          <Text size="sm" fw={500} mb="xs">
            Permissions
          </Text>
          <MultiSelect
            data={permissionOptions}
            value={form.values.permissionIds.map(id => id.toString())}
            onChange={(values) => 
              form.setFieldValue('permissionIds', values.map(v => parseInt(v, 10)))
            }
            placeholder="Select permissions for this role"
            searchable
            clearable
            maxDropdownHeight={300}
            disabled={loading}
            styles={{
              dropdown: {
                maxHeight: 300,
              },
            }}
          />
          <Text size="xs" c="dimmed" mt={4}>
            {form.values.permissionIds.length} permission(s) selected
          </Text>
        </div>

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onCancel}
            disabled={loading}
            leftSection={<IconX size={16} />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            leftSection={<IconCheck size={16} />}
          >
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};