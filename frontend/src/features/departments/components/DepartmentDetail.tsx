import React from 'react';
import { Card, Text, Stack, Group, Button } from '@mantine/core';
import type { Department } from '../../../types';

interface DepartmentDetailProps {
  department: Department;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
  onClose: () => void;
  onCreateChild: (parentId: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const DepartmentDetail: React.FC<DepartmentDetailProps> = ({
  department,
  onEdit,
  onDelete,
  onClose,
  onCreateChild,
  canEdit,
  canDelete,
}) => {
  return (
    <Card padding="lg" radius="md" withBorder data-testid="department-detail">
      <Text fw={600} size="lg" mb="md">
        Department Details
      </Text>
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} c="dimmed">
            Name
          </Text>
          <Text>{department.name}</Text>
        </div>
        {department.description && (
          <div>
            <Text size="sm" fw={500} c="dimmed">
              Description
            </Text>
            <Text>{department.description}</Text>
          </div>
        )}
        <div>
          <Text size="sm" fw={500} c="dimmed">
            Employee Count
          </Text>
          <Text>{department.employeeCount || 0}</Text>
        </div>
        <div>
          <Text size="sm" fw={500} c="dimmed">
            Created
          </Text>
          <Text>
            {department.createdAt
              ? new Date(department.createdAt).toLocaleDateString()
              : 'Unknown'}
          </Text>
        </div>
      </Stack>

      {(canEdit || canDelete) && (
        <Group gap="sm" mt="lg">
          {canEdit && (
            <Button
              variant="light"
              onClick={() => onCreateChild(department.id)}
            >
              Add Child
            </Button>
          )}
          {canEdit && (
            <Button variant="light" onClick={() => onEdit(department)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="light"
              color="red"
              onClick={() => onDelete(department)}
            >
              Delete
            </Button>
          )}
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </Group>
      )}
    </Card>
  );
};
