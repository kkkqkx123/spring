import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { EmployeeCard } from './EmployeeCard';
import type { Employee } from '../../../types';

const mockEmployee: Employee = {
  id: 1,
  employeeNumber: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  department: {
    id: 1,
    name: 'Engineering',
    description: 'Software Development',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  position: {
    id: 1,
    title: 'Software Engineer',
    description: 'Develops software',
    departmentId: 1,
  },
  hireDate: '2024-01-15T00:00:00Z',
  salary: 75000,
  status: 'ACTIVE',
  profilePicture: 'https://example.com/profile.jpg',
};

const defaultProps = {
  employee: mockEmployee,
  selected: false,
  onSelect: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  selectable: true,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('EmployeeCard', () => {
  const renderWithWrapper = (props = defaultProps) => {
    return render(
      <TestWrapper>
        <EmployeeCard {...props} />
      </TestWrapper>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee information correctly', () => {
    renderWithWrapper();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('#EMP001')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    expect(screen.getByText('$75,000')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('formats hire date correctly', () => {
    renderWithWrapper();

    expect(screen.getByText('Hired: Jan 15, 2024')).toBeInTheDocument();
  });

  it('shows checkbox when selectable is true', () => {
    renderWithWrapper();

    const checkbox = screen.getByLabelText('Select John Doe');
    expect(checkbox).toBeInTheDocument();
  });

  it('hides checkbox when selectable is false', () => {
    renderWithWrapper({ ...defaultProps, selectable: false });

    const checkbox = screen.queryByLabelText('Select John Doe');
    expect(checkbox).not.toBeInTheDocument();
  });

  it('calls onSelect when checkbox is clicked', () => {
    renderWithWrapper();

    const checkbox = screen.getByLabelText('Select John Doe');
    fireEvent.click(checkbox);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(true);
  });

  it('shows selected state correctly', () => {
    renderWithWrapper({ ...defaultProps, selected: true });

    const checkbox = screen.getByLabelText('Select John Doe');
    expect(checkbox).toBeChecked();
  });

  it('shows action menu with correct options', async () => {
    renderWithWrapper();

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onView when View Details is clicked', async () => {
    renderWithWrapper();

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(defaultProps.onView).toHaveBeenCalledWith(mockEmployee);
  });

  it('calls onEdit when Edit is clicked', async () => {
    renderWithWrapper();

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEmployee);
  });

  it('calls onDelete when Delete is clicked', async () => {
    renderWithWrapper();

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockEmployee);
  });

  it('shows correct status badge color for ACTIVE status', () => {
    renderWithWrapper();

    const statusBadge = screen.getByText('ACTIVE');
    expect(statusBadge).toBeInTheDocument();
  });

  it('shows correct status badge color for INACTIVE status', () => {
    const inactiveEmployee = { ...mockEmployee, status: 'INACTIVE' as const };
    renderWithWrapper({ ...defaultProps, employee: inactiveEmployee });

    const statusBadge = screen.getByText('INACTIVE');
    expect(statusBadge).toBeInTheDocument();
  });

  it('shows correct status badge color for TERMINATED status', () => {
    const terminatedEmployee = {
      ...mockEmployee,
      status: 'TERMINATED' as const,
    };
    renderWithWrapper({ ...defaultProps, employee: terminatedEmployee });

    const statusBadge = screen.getByText('TERMINATED');
    expect(statusBadge).toBeInTheDocument();
  });

  it('shows avatar with initials when no profile picture', () => {
    const employeeWithoutPicture = {
      ...mockEmployee,
      profilePicture: undefined,
    };
    renderWithWrapper({ ...defaultProps, employee: employeeWithoutPicture });

    // Avatar should show initials JD
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('hides salary when not provided', () => {
    const employeeWithoutSalary = { ...mockEmployee, salary: undefined };
    renderWithWrapper({ ...defaultProps, employee: employeeWithoutSalary });

    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('hides phone when not provided', () => {
    const employeeWithoutPhone = { ...mockEmployee, phone: undefined };
    renderWithWrapper({ ...defaultProps, employee: employeeWithoutPhone });

    expect(screen.queryByText('+1-555-0123')).not.toBeInTheDocument();
  });

  it('hides email when not provided', () => {
    const employeeWithoutEmail = { ...mockEmployee, email: '' };
    renderWithWrapper({ ...defaultProps, employee: employeeWithoutEmail });

    expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
  });
});
