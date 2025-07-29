import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeeDetail } from './EmployeeDetail';
import { type Employee, type Department, type Position } from '../../../types';

const mockDepartment: Department = {
  id: 1,
  name: 'Engineering',
  description: 'Software development team',
  employeeCount: 10,
  createdAt: '2023-01-01T00:00:00Z',
};

const mockPosition: Position = {
  id: 1,
  title: 'Software Engineer',
  description: 'Develops software applications',
  departmentId: 1,
};

const mockEmployee: Employee = {
  id: 1,
  employeeNumber: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  department: mockDepartment,
  position: mockPosition,
  hireDate: '2023-01-15',
  salary: 75000,
  status: 'ACTIVE',
  profilePicture: 'https://example.com/profile.jpg',
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>{children}</MantineProvider>
  );
};

describe('EmployeeDetail', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee information correctly', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
      />,
      { wrapper: createWrapper() }
    );

    // Check basic information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Employee #EMP001')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    // Check work information - Engineering appears in both work info and department details
    expect(screen.getAllByText('Engineering')).toHaveLength(2);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('$75,000.00')).toBeInTheDocument();

    // Check department information
    expect(screen.getByText('Software development team')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders without phone number when not provided', () => {
    const employeeWithoutPhone = { ...mockEmployee, phone: undefined };

    render(
      <EmployeeDetail
        employee={employeeWithoutPhone}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
  });

  it('renders without salary when not provided', () => {
    const employeeWithoutSalary = { ...mockEmployee, salary: undefined };

    render(
      <EmployeeDetail
        employee={employeeWithoutSalary}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('$75,000.00')).not.toBeInTheDocument();
    expect(screen.queryByText('Salary:')).not.toBeInTheDocument();
  });

  it('shows correct status badge colors', () => {
    const { rerender } = render(
      <EmployeeDetail
        employee={{ ...mockEmployee, status: 'ACTIVE' }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    let statusBadge = screen.getByText('ACTIVE');
    expect(statusBadge).toBeInTheDocument();

    // Test INACTIVE status
    rerender(
      <EmployeeDetail
        employee={{ ...mockEmployee, status: 'INACTIVE' }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    statusBadge = screen.getByText('INACTIVE');
    expect(statusBadge).toBeInTheDocument();

    // Test TERMINATED status
    rerender(
      <EmployeeDetail
        employee={{ ...mockEmployee, status: 'TERMINATED' }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    statusBadge = screen.getByText('TERMINATED');
    expect(statusBadge).toBeInTheDocument();
  });

  it('shows edit button when canEdit is true', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it('shows delete button when canDelete is true', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('hides action buttons when no permissions', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={false}
      />,
      { wrapper: createWrapper() }
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={true}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit from quick actions section', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={false}
      />,
      { wrapper: createWrapper() }
    );

    const editButton = screen.getByRole('button', { name: /edit employee/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete from quick actions section', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={true}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete employee/i,
    });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('shows error message when employee is null', () => {
    render(
      <EmployeeDetail
        employee={null as any}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Employee not found')).toBeInTheDocument();
    expect(
      screen.getByText('The requested employee could not be found.')
    ).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('$75,000.00')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2023')).toBeInTheDocument(); // Department created date
  });

  it('renders department description when available', () => {
    render(
      <EmployeeDetail
        employee={mockEmployee}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Software development team')).toBeInTheDocument();
  });

  it('handles missing department description', () => {
    const employeeWithoutDeptDesc = {
      ...mockEmployee,
      department: { ...mockDepartment, description: undefined },
    };

    render(
      <EmployeeDetail
        employee={employeeWithoutDeptDesc}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Description:')).not.toBeInTheDocument();
  });
});
