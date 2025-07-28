import React from 'react';
import {
  Card,
  Avatar,
  Text,
  Group,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  Divider,
  Checkbox,
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconCalendar,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { Employee } from '../../../types';

interface EmployeeCardProps {
  employee: Employee;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  selectable?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'INACTIVE':
      return 'yellow';
    case 'TERMINATED':
      return 'red';
    default:
      return 'gray';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  selected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  selectable = false,
}) => {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const avatarSrc = employee.profilePicture || undefined;

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Stack gap="sm">
        {/* Header with avatar and actions */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            {selectable && (
              <Checkbox
                checked={selected}
                onChange={(event) => onSelect?.(event.currentTarget.checked)}
                aria-label={`Select ${fullName}`}
              />
            )}
            <Avatar
              src={avatarSrc}
              alt={fullName}
              size="lg"
              radius="md"
            >
              {employee.firstName[0]}{employee.lastName[0]}
            </Avatar>
            <Stack gap={4}>
              <Text fw={600} size="lg" lineClamp={1}>
                {fullName}
              </Text>
              <Text size="sm" c="dimmed">
                #{employee.employeeNumber}
              </Text>
            </Stack>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {onView && (
                <Menu.Item
                  leftSection={<IconEye size={14} />}
                  onClick={() => onView(employee)}
                >
                  View Details
                </Menu.Item>
              )}
              {onEdit && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit(employee)}
                >
                  Edit
                </Menu.Item>
              )}
              {onDelete && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    onClick={() => onDelete(employee)}
                  >
                    Delete
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Divider />

        {/* Employee Details */}
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" fw={500}>Position:</Text>
            <Text size="sm">{employee.position.title}</Text>
          </Group>
          
          <Group gap="xs">
            <Text size="sm" fw={500}>Department:</Text>
            <Text size="sm">{employee.department.name}</Text>
          </Group>

          {employee.email && (
            <Group gap="xs">
              <IconMail size={14} />
              <Text size="sm" lineClamp={1}>{employee.email}</Text>
            </Group>
          )}

          {employee.phone && (
            <Group gap="xs">
              <IconPhone size={14} />
              <Text size="sm">{employee.phone}</Text>
            </Group>
          )}

          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="sm">Hired: {formatDate(employee.hireDate)}</Text>
          </Group>
        </Stack>

        <Divider />

        {/* Status Badge */}
        <Group justify="space-between" align="center">
          <Badge
            color={getStatusColor(employee.status)}
            variant="light"
            size="sm"
          >
            {employee.status}
          </Badge>
          
          {employee.salary && (
            <Text size="sm" fw={500} c="blue">
              ${employee.salary.toLocaleString()}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
};