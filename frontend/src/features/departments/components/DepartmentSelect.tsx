import React, { useMemo } from 'react';
import { Select, type SelectProps, Loader } from '@mantine/core';
import { IconAlertCircle, IconBuilding } from '@tabler/icons-react';
import { useDepartmentTree } from '../hooks/useDepartmentTree';
import { type Department } from '../../../types';

interface DepartmentSelectProps extends Omit<SelectProps, 'data'> {
  excludeId?: number; // Exclude a specific department (useful when editing)
  includeRoot?: boolean; // Include a "No Parent" option
  rootLabel?: string; // Label for the root option
  showEmployeeCount?: boolean; // Show employee count in labels
}

interface DepartmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const flattenDepartments = (
  departments: Department[],
  level = 0,
  excludeId?: number,
  showEmployeeCount = false
): DepartmentOption[] => {
  const options: DepartmentOption[] = [];

  departments.forEach(dept => {
    if (!excludeId || dept.id !== excludeId) {
      const indent = '  '.repeat(level);
      const employeeCountText = showEmployeeCount
        ? ` (${dept.employeeCount})`
        : '';
      const label = `${indent}${dept.name}${employeeCountText}`;

      options.push({
        value: dept.id.toString(),
        label,
        disabled: false,
      });
    }

    if (dept.children && dept.children.length > 0) {
      options.push(
        ...flattenDepartments(
          dept.children,
          level + (excludeId === dept.id ? 0 : 1),
          excludeId,
          showEmployeeCount
        )
      );
    }
  });

  return options;
};

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  excludeId,
  includeRoot = false,
  rootLabel = 'No Parent Department',
  showEmployeeCount = false,
  placeholder = 'Select department...',
  ...rest
}) => {
  const { data: departments, isLoading, error } = useDepartmentTree();

  const options = useMemo(() => {
    if (!departments) return [];

    const departmentOptions = flattenDepartments(
      departments,
      0,
      excludeId,
      showEmployeeCount
    );

    if (includeRoot) {
      return [{ value: '', label: rootLabel }, ...departmentOptions];
    }

    return departmentOptions;
  }, [departments, excludeId, includeRoot, rootLabel, showEmployeeCount]);

  if (isLoading) {
    return (
      <Select
        {...rest}
        placeholder="Loading departments..."
        data={[]}
        disabled
        rightSection={<Loader size="xs" />}
      />
    );
  }

  if (error) {
    return (
      <Select
        {...rest}
        placeholder="Error loading departments"
        data={[]}
        disabled
        error="Failed to load departments"
        rightSection={<IconAlertCircle size={16} />}
      />
    );
  }

  return (
    <Select
      {...rest}
      data={options}
      placeholder={placeholder}
      leftSection={<IconBuilding size={16} />}
      searchable
      clearable
      clearButtonProps={{ 'aria-label': 'Clear select' }}
      maxDropdownHeight={300}
    />
  );
};

// Simplified version for basic use cases
export const SimpleDepartmentSelect: React.FC<
  Omit<SelectProps, 'data'>
> = props => {
  const { data: departments, isLoading, error } = useDepartmentTree();

  const options = useMemo(() => {
    if (!departments) return [];

    return flattenDepartments(departments, 0, undefined, false);
  }, [departments]);

  if (isLoading) {
    return (
      <Select
        {...props}
        placeholder="Loading..."
        data={[]}
        disabled
        rightSection={<Loader size="xs" />}
      />
    );
  }

  if (error) {
    return (
      <Select
        {...props}
        placeholder="Error loading departments"
        data={[]}
        disabled
        error="Failed to load departments"
      />
    );
  }

  return (
    <Select
      {...props}
      data={options}
      placeholder="Select department..."
      leftSection={<IconBuilding size={16} />}
      searchable
      clearable
      clearButtonProps={{ 'aria-label': 'Clear select' }}
    />
  );
};
