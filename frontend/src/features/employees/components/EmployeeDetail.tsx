import React from 'react';
import {
  Box,
  Card,
  Group,
  Text,
  Avatar,
  Badge,
  Stack,
  Grid,
  Divider,
  Button,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconCalendar,
  IconBuilding,
  IconBriefcase,
  IconCurrencyDollar,
  IconUser,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Employee } from '../../../types';
import { LoadingSpinner } from '../../../components/ui';

interface EmployeeDetailProps {
  employee: Employee;
  loading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
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

const formatCurrency = (amount?: number) => {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({
  employee,
  loading = false,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!employee) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Employee not found"
        color="red"
      >
        The requested employee could not be found.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {/* Header Card */}
      <Card shadow="sm" padding="lg" radius="md">
        <Group justify="space-between" align="flex-start">
          <Group align="flex-start" gap="lg">
            <Avatar
              src={employee.profilePicture}
              size={100}
              radius="md"
              alt={`${employee.firstName} ${employee.lastName}`}
            >
              <IconUser size={50} />
            </Avatar>
            
            <Stack gap="xs">
              <Group align="center" gap="sm">
                <Text size="xl" fw={700}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Badge
                  color={getStatusColor(employee.status)}
                  variant="filled"
                  size="sm"
                >
                  {employee.status}
                </Badge>
              </Group>
              
              <Text size="md" c="dimmed">
                Employee #{employee.employeeNumber}
              </Text>
              
              <Group gap="md">
                <Group gap="xs">
                  <IconMail size={16} />
                  <Text size="sm">{employee.email}</Text>
                </Group>
                
                {employee.phone && (
                  <Group gap="xs">
                    <IconPhone size={16} />
                    <Text size="sm">{employee.phone}</Text>
                  </Group>
                )}
              </Group>
            </Stack>
          </Group>

          {/* Action Buttons */}
          <Group gap="xs">
            {canEdit && (
              <Tooltip label="Edit Employee">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  onClick={onEdit}
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {canDelete && (
              <Tooltip label="Delete Employee">
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={onDelete}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card>

      {/* Details Cards */}
      <Grid>
        {/* Work Information */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Stack gap="md">
              <Group align="center" gap="xs">
                <IconBriefcase size={20} />
                <Text size="lg" fw={600}>Work Information</Text>
              </Group>
              
              <Divider />
              
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Department:</Text>
                  <Group gap="xs">
                    <IconBuilding size={16} />
                    <Text size="sm" fw={500}>
                      {employee.department.name}
                    </Text>
                  </Group>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Position:</Text>
                  <Text size="sm" fw={500}>
                    {employee.position.title}
                  </Text>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Hire Date:</Text>
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm" fw={500}>
                      {formatDate(employee.hireDate)}
                    </Text>
                  </Group>
                </Group>
                
                {employee.salary && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Salary:</Text>
                    <Group gap="xs">
                      <IconCurrencyDollar size={16} />
                      <Text size="sm" fw={500}>
                        {formatCurrency(employee.salary)}
                      </Text>
                    </Group>
                  </Group>
                )}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Department Information */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" h="100%">
            <Stack gap="md">
              <Group align="center" gap="xs">
                <IconBuilding size={20} />
                <Text size="lg" fw={600}>Department Details</Text>
              </Group>
              
              <Divider />
              
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Department Name:</Text>
                  <Text size="sm" fw={500}>
                    {employee.department.name}
                  </Text>
                </Group>
                
                {employee.department.description && (
                  <Box>
                    <Text size="sm" c="dimmed" mb="xs">Description:</Text>
                    <Text size="sm">
                      {employee.department.description}
                    </Text>
                  </Box>
                )}
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Total Employees:</Text>
                  <Text size="sm" fw={500}>
                    {employee.department.employeeCount}
                  </Text>
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Created:</Text>
                  <Text size="sm" fw={500}>
                    {formatDate(employee.department.createdAt)}
                  </Text>
                </Group>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      {(canEdit || canDelete) && (
        <Card shadow="sm" padding="lg" radius="md">
          <Group justify="space-between" align="center">
            <Text size="lg" fw={600}>Quick Actions</Text>
            
            <Group gap="md">
              {canEdit && (
                <Button
                  leftSection={<IconEdit size={16} />}
                  variant="light"
                  color="blue"
                  onClick={onEdit}
                >
                  Edit Employee
                </Button>
              )}
              
              {canDelete && (
                <Button
                  leftSection={<IconTrash size={16} />}
                  variant="light"
                  color="red"
                  onClick={onDelete}
                >
                  Delete Employee
                </Button>
              )}
            </Group>
          </Group>
        </Card>
      )}
    </Stack>
  );
};