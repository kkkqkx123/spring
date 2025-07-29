import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Select,
  TextInput,
  NumberInput,
  FileInput,
  Avatar,
  Text,
  Stack,
  Grid,
  Card,
  Divider,
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconUpload, IconUser, IconAlertCircle } from '@tabler/icons-react';
import { type Employee, type EmployeeStatus } from '../../../types';
import {
  type EmployeeCreateRequest,
  type EmployeeUpdateRequest,
} from '../services/employeeApi';
import { useDepartments } from '../../departments/hooks/useDepartments';
import {
  usePositions,
  usePositionsByDepartment,
} from '../../positions/hooks/usePositions';
import { useUploadProfilePicture } from '../hooks/useEmployees';
import { FormField } from '../../../components/ui';

// Validation schema
const employeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  departmentId: z.number().min(1, 'Department is required'),
  positionId: z.number().min(1, 'Position is required'),
  hireDate: z.instanceof(Date, { message: 'Hire date is required' }),
  salary: z.number().positive('Salary must be positive').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED'] as const),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeCreateRequest | EmployeeUpdateRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(employee?.profilePicture || null);

  const { data: departments = [], isLoading: departmentsLoading } =
    useDepartments();
  const { data: allPositions = [], isLoading: positionsLoading } =
    usePositions();

  const uploadProfilePicture = useUploadProfilePicture();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNumber: employee?.employeeNumber || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      departmentId: employee?.department?.id || 0,
      positionId: employee?.position?.id || 0,
      hireDate: employee?.hireDate ? new Date(employee.hireDate) : new Date(),
      salary: employee?.salary || undefined,
      status: (employee?.status as EmployeeStatus) || 'ACTIVE',
    },
  });

  const selectedDepartmentId = watch('departmentId');
  const { data: departmentPositions = [] } =
    usePositionsByDepartment(selectedDepartmentId);

  // Reset position when department changes
  useEffect(() => {
    if (selectedDepartmentId && !employee) {
      setValue('positionId', 0);
    }
  }, [selectedDepartmentId, setValue, employee]);

  // Update form when employee prop changes
  useEffect(() => {
    if (employee) {
      reset({
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        departmentId: employee.department.id,
        positionId: employee.position.id,
        hireDate: new Date(employee.hireDate),
        salary: employee.salary || undefined,
        status: employee.status as EmployeeStatus,
      });
      setProfilePicturePreview(employee.profilePicture || null);
    }
  }, [employee, reset]);

  const handleProfilePictureChange = (file: File | null) => {
    setProfilePicture(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePicturePreview(employee?.profilePicture || null);
    }
  };

  const onFormSubmit = async (data: EmployeeFormData) => {
    const formData: EmployeeCreateRequest | EmployeeUpdateRequest = {
      ...(employee && { id: employee.id }),
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      departmentId: data.departmentId,
      positionId: data.positionId,
      hireDate: data.hireDate.toISOString().split('T')[0],
      salary: data.salary || undefined,
      status: data.status,
    };

    try {
      await onSubmit(formData);

      // Upload profile picture if provided and employee was created/updated successfully
      if (profilePicture && employee?.id) {
        await uploadProfilePicture.mutateAsync({
          employeeId: employee.id,
          file: profilePicture,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.id.toString(),
    label: dept.name,
  }));

  const positionOptions = (
    selectedDepartmentId ? departmentPositions : allPositions
  ).map(pos => ({
    value: pos.id.toString(),
    label: pos.title,
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Stack gap="md">
          <Text size="lg" fw={600} component="h2">
            {employee ? 'Employee Information' : 'New Employee Information'}
          </Text>

          <Divider />

          {/* Profile Picture Section */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Profile Picture
            </Text>
            <Group align="flex-start" gap="md">
              <Avatar
                src={profilePicturePreview}
                size={80}
                radius="md"
                alt="Profile picture"
              >
                <IconUser size={40} />
              </Avatar>
              <Box>
                <FileInput
                  placeholder="Choose profile picture"
                  accept="image/*"
                  leftSection={<IconUpload size={16} />}
                  onChange={handleProfilePictureChange}
                  clearable
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </Text>
              </Box>
            </Group>
          </Box>

          <Divider />

          {/* Basic Information */}
          <Grid>
            <Grid.Col span={6}>
              <FormField
                label="Employee Number"
                error={errors.employeeNumber?.message}
                required
              >
                <Controller
                  name="employeeNumber"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      placeholder="Enter employee number"
                      error={!!errors.employeeNumber}
                      data-testid="employee-number-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField label="Status" error={errors.status?.message} required>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      data={statusOptions}
                      placeholder="Select status"
                      error={!!errors.status}
                      data-testid="status-select"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField
                label="First Name"
                error={errors.firstName?.message}
                required
              >
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      placeholder="Enter first name"
                      error={!!errors.firstName}
                      data-testid="first-name-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField
                label="Last Name"
                error={errors.lastName?.message}
                required
              >
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      placeholder="Enter last name"
                      error={!!errors.lastName}
                      data-testid="last-name-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField label="Email" error={errors.email?.message} required>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                      error={!!errors.email}
                      data-testid="email-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField label="Phone" error={errors.phone?.message}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      placeholder="Enter phone number"
                      error={!!errors.phone}
                      data-testid="phone-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>
          </Grid>

          <Divider />

          {/* Work Information */}
          <Grid>
            <Grid.Col span={6}>
              <FormField
                label="Department"
                error={errors.departmentId?.message}
                required
              >
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value ? field.value.toString() : ''}
                      onChange={value =>
                        field.onChange(value ? parseInt(value) : 0)
                      }
                      data={departmentOptions}
                      placeholder="Select department"
                      error={!!errors.departmentId}
                      disabled={departmentsLoading}
                      searchable
                      data-testid="department-select"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField
                label="Position"
                error={errors.positionId?.message}
                required
              >
                <Controller
                  name="positionId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value ? field.value.toString() : ''}
                      onChange={value =>
                        field.onChange(value ? parseInt(value) : 0)
                      }
                      data={positionOptions}
                      placeholder="Select position"
                      error={!!errors.positionId}
                      disabled={positionsLoading || !selectedDepartmentId}
                      searchable
                      data-testid="position-select"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField
                label="Hire Date"
                error={errors.hireDate?.message}
                required
              >
                <Controller
                  name="hireDate"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      {...field}
                      placeholder="Select hire date"
                      error={!!errors.hireDate}
                      maxDate={new Date()}
                      data-testid="hire-date-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>

            <Grid.Col span={6}>
              <FormField label="Salary" error={errors.salary?.message}>
                <Controller
                  name="salary"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      {...field}
                      placeholder="Enter salary"
                      error={!!errors.salary}
                      min={0}
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="$"
                      thousandSeparator=","
                      data-testid="salary-input"
                    />
                  )}
                />
              </FormField>
            </Grid.Col>
          </Grid>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Please fix the following errors:"
              color="red"
            >
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error?.message}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Divider />

          {/* Form Actions */}
          <Group justify="flex-end" gap="md">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!isValid}>
              {employee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
};
