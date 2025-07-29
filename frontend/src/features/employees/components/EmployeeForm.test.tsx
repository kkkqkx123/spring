import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeeForm } from './EmployeeForm';
import { type Employee, type Department, type Position } from '../../../types';
import * as departmentHooks from '../../departments/hooks/useDepartments';
import * as positionHooks from '../../positions/hooks/usePositions';
import * as employeeHooks from '../hooks/useEmployees';

// Mock the hooks
vi.mock('../../departments/hooks/useDepartments');
vi.mock('../../positions/hooks/usePositions');
vi.mock('../hooks/useEmployees');

const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software development team',
    employeeCount: 10,
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Marketing',
    description: 'Marketing and sales team',
    employeeCount: 5,
    createdAt: '2023-01-01T00:00:00Z',
  },
];

const mockPositions: Position[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Develops software applications',
    departmentId: 1,
  },
  {
    id: 2,
    title: 'Marketing Manager',
    description: 'Manages marketing campaigns',
    departmentId: 2,
  },
];

const mockEmployee: Employee = {
  id: 1,
  employeeNumber: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  department: mockDepartments[0],
  position: mockPositions[0],
  hireDate: '2023-01-15',
  salary: 75000,
  status: 'ACTIVE',
  profilePicture: '',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

describe('EmployeeForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUploadProfilePicture = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock department hooks
    (departmentHooks.useDepartments as any).mockReturnValue({
      data: mockDepartments,
      isLoading: false,
    });

    // Mock position hooks
    (positionHooks.usePositions as any).mockReturnValue({
      data: mockPositions,
      isLoading: false,
    });

    (positionHooks.usePositionsByDepartment as any).mockReturnValue({
      data: mockPositions.filter(p => p.departmentId === 1),
    });

    // Mock upload profile picture hook
    (employeeHooks.useUploadProfilePicture as any).mockReturnValue(
      mockUploadProfilePicture
    );
  });

  it('renders create form correctly', () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(screen.getByLabelText(/employee number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create employee/i })
    ).toBeInTheDocument();
  });

  it('renders edit form with employee data', async () => {
    render(
      <EmployeeForm
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('EMP001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('john.doe@example.com')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /update employee/i })
      ).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const submitButton = screen.getByRole('button', {
      name: /create employee/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/employee number is required/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/department is required/i)).toBeInTheDocument();
      expect(screen.getByText(/position is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', {
      name: /create employee/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Fill in required fields
    await user.type(screen.getByLabelText(/employee number/i), 'EMP002');
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane.smith@example.com');

    // Select department
    await user.click(screen.getByRole('combobox', { name: /department/i }));
    await user.click(screen.getByText('Engineering'));

    // Select position
    await user.click(screen.getByRole('combobox', { name: /position/i }));
    await user.click(screen.getByText('Software Engineer'));

    const submitButton = screen.getByRole('button', {
      name: /create employee/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeNumber: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          departmentId: 1,
          positionId: 1,
          status: 'ACTIVE',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables position select when no department is selected', () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const positionSelect = screen.getByTestId('position-select');
    expect(positionSelect).toBeDisabled();
  });

  it('filters positions by selected department', async () => {
    const user = userEvent.setup();

    // Mock positions for specific department
    (positionHooks.usePositionsByDepartment as any).mockReturnValue({
      data: [mockPositions[0]], // Only engineering position
    });

    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Select engineering department
    await user.click(screen.getByRole('combobox', { name: /department/i }));
    await user.click(screen.getByText('Engineering'));

    // Check that position select is enabled and has correct options
    const positionSelect = screen.getByRole('combobox', { name: /position/i });
    expect(positionSelect).not.toBeDisabled();

    await user.click(positionSelect);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Marketing Manager')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <EmployeeForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', {
      name: /create employee/i,
    });
    expect(submitButton).toBeDisabled();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });
});
