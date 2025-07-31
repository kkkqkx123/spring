import React from 'react';
import {
  Paper,
  TextInput,
  Select,
  Group,
  Button,
  Stack,
  Collapse,
  ActionIcon,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import type { EmployeeSearchCriteria } from '../services/employeeApi';
import type { Department, Position } from '../../../types';

interface EmployeeSearchProps {
  onSearch: (criteria: EmployeeSearchCriteria) => void;
  onClear: () => void;
  departments: Department[];
  positions: Position[];
  loading?: boolean;
  initialValues?: EmployeeSearchCriteria;
}

const employeeStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export const EmployeeSearch: React.FC<EmployeeSearchProps> = ({
  onSearch,
  onClear,
  departments,
  positions,
  loading = false,
  initialValues = {},
}) => {
  const [advancedOpen, { toggle: toggleAdvanced }] = useDisclosure(false);

  const form = useForm<EmployeeSearchCriteria>({
    initialValues: {
      name: '',
      email: '',
      departmentId: undefined,
      positionId: undefined,
      status: '',
      ...initialValues,
    },
  });

  const handleSubmit = (values: EmployeeSearchCriteria) => {
    // Filter out empty values
    const filteredCriteria = Object.entries(values).reduce(
      (acc, [key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          acc[key as keyof EmployeeSearchCriteria] = value;
        }
        return acc;
      },
      {} as EmployeeSearchCriteria
    );

    onSearch(filteredCriteria);
  };

  const handleClear = () => {
    form.reset();
    onClear();
  };

  const hasActiveFilters = Object.values(form.values).some(
    value => value !== '' && value !== undefined && value !== null
  );

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(dept => ({
      value: dept.id.toString(),
      label: dept.name,
    })),
  ];

  const positionOptions = [
    { value: '', label: 'All Positions' },
    ...positions.map(pos => ({
      value: pos.id.toString(),
      label: pos.title,
    })),
  ];

  return (
    <Paper withBorder p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Search */}
          <Group gap="md">
            <TextInput
              placeholder="Search by name..."
              leftSection={<IconSearch size={16} />}
              flex={1}
              {...form.getInputProps('name')}
            />

            <Button
              type="submit"
              loading={loading}
              leftSection={<IconSearch size={16} />}
            >
              Search
            </Button>

            {hasActiveFilters && (
              <Button
                variant="light"
                color="gray"
                onClick={handleClear}
                leftSection={<IconX size={16} />}
              >
                Clear
              </Button>
            )}

            <ActionIcon
              variant="light"
              onClick={toggleAdvanced}
              aria-label="Toggle advanced search"
            >
              {advancedOpen ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )}
            </ActionIcon>
          </Group>

          {/* Advanced Search */}
          <Collapse in={advancedOpen}>
            <Stack gap="md">
              <Group gap="md" align="center">
                <IconFilter size={16} />
                <Text size="sm" fw={500}>
                  Advanced Filters
                </Text>
              </Group>

              <Group gap="md" grow>
                <TextInput
                  label="Email"
                  placeholder="Search by email..."
                  {...form.getInputProps('email')}
                />

                <Select
                  label="Department"
                  placeholder="Select department"
                  data={departmentOptions}
                  value={form.values.departmentId?.toString() || ''}
                  onChange={value =>
                    form.setFieldValue(
                      'departmentId',
                      value ? parseInt(value) : undefined
                    )
                  }
                  clearable
                />

                <Select
                  label="Position"
                  placeholder="Select position"
                  data={positionOptions}
                  value={form.values.positionId?.toString() || ''}
                  onChange={value =>
                    form.setFieldValue(
                      'positionId',
                      value ? parseInt(value) : undefined
                    )
                  }
                  clearable
                />

                <Select
                  label="Status"
                  placeholder="Select status"
                  data={employeeStatusOptions}
                  {...form.getInputProps('status')}
                  clearable
                />
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </form>
    </Paper>
  );
};
