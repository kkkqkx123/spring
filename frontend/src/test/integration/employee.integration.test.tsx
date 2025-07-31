import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import { EmployeeList } from '../../features/employees/components/EmployeeList';
import { EmployeeForm } from '../../features/employees/components/EmployeeForm';
import { employeeApi } from '../../services/employeeApi';

// Mock the employee API
vi.mock('../../services/employeeApi', () => ({
  employeeApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
  },
}));

const mockEmployeeApi = employeeApi as any;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <BrowserRouter>{children}</BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
};

const mockEmployees = [
  {
    id: 1,
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    department: { id: 1, name: 'Engineering' },
    position: { id: 1, name: 'Software Developer' },
    hireDate: '2024-01-15',
    status: 'ACTIVE' as const,
  },
  {
    id: 2,
    employeeNumber: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567891',
    department: { id: 2, name: 'Marketing' },
    position: { id: 2, name: 'Marketing Manager' },
    hireDate: '2024-02-01',
    status: 'ACTIVE' as const,
  },
];

describe('Employee Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays employee list', async () => {
    mockEmployeeApi.getAll.mockResolvedValue({
      content: mockEmployees,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    });

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Wait for employees to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockEmployeeApi.getAll).toHaveBeenCalledWith({
      page: 0,
      size: 10,
    });
  });

  it('handles employee search functionality', async () => {
    const user = userEvent.setup();

    mockEmployeeApi.search.mockResolvedValue({
      content: [mockEmployees[0]],
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search employees/i);
    await user.type(searchInput, 'John');

    // Trigger search
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Verify search API was called
    await waitFor(() => {
      expect(mockEmployeeApi.search).toHaveBeenCalledWith({
        name: 'John',
      });
    });
  });

  it('creates new employee successfully', async () => {
    const user = userEvent.setup();
    const newEmployee = {
      employeeNumber: 'EMP003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      phone: '+1234567892',
      departmentId: 1,
      positionId: 1,
      hireDate: '2024-03-01',
      status: 'ACTIVE' as const,
    };

    const createdEmployee = { id: 3, ...newEmployee };
    mockEmployeeApi.create.mockResolvedValue(createdEmployee);

    const mockOnSuccess = vi.fn();

    render(
      <TestWrapper>
        <EmployeeForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill in the form
    await user.type(
      screen.getByLabelText(/employee number/i),
      newEmployee.employeeNumber
    );
    await user.type(
      screen.getByLabelText(/first name/i),
      newEmployee.firstName
    );
    await user.type(screen.getByLabelText(/last name/i), newEmployee.lastName);
    await user.type(screen.getByLabelText(/email/i), newEmployee.email);
    await user.type(screen.getByLabelText(/phone/i), newEmployee.phone);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    // Verify API call and success
    await waitFor(() => {
      expect(mockEmployeeApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeNumber: newEmployee.employeeNumber,
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          email: newEmployee.email,
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(createdEmployee);
    });
  });

  it('updates existing employee successfully', async () => {
    const user = userEvent.setup();
    const existingEmployee = mockEmployees[0];
    const updatedEmployee = {
      ...existingEmployee,
      firstName: 'John Updated',
      email: 'john.updated@example.com',
    };

    mockEmployeeApi.update.mockResolvedValue(updatedEmployee);

    const mockOnSuccess = vi.fn();

    render(
      <TestWrapper>
        <EmployeeForm employee={existingEmployee} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Update form fields
    const firstNameInput = screen.getByDisplayValue(existingEmployee.firstName);
    const emailInput = screen.getByDisplayValue(existingEmployee.email);

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'John Updated');

    await user.clear(emailInput);
    await user.type(emailInput, 'john.updated@example.com');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    // Verify API call and success
    await waitFor(() => {
      expect(mockEmployeeApi.update).toHaveBeenCalledWith(
        existingEmployee.id,
        expect.objectContaining({
          firstName: 'John Updated',
          email: 'john.updated@example.com',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedEmployee);
    });
  });

  it('deletes employee successfully', async () => {
    const user = userEvent.setup();

    mockEmployeeApi.getAll.mockResolvedValue({
      content: mockEmployees,
      totalElements: 2,
      totalPages: 1,
    });

    mockEmployeeApi.delete.mockResolvedValue({});

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Wait for employees to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText(/delete employee/i);
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify API call
    await waitFor(() => {
      expect(mockEmployeeApi.delete).toHaveBeenCalledWith(1);
    });
  });

  it('handles form validation errors', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmployeeForm onSuccess={vi.fn()} />
      </TestWrapper>
    );

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    // Verify validation errors are shown
    await waitFor(() => {
      expect(
        screen.getByText(/employee number is required/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockEmployeeApi.getAll.mockRejectedValue(new Error('Server Error'));

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Verify error state is shown
    await waitFor(() => {
      expect(screen.getByText(/failed to load employees/i)).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const user = userEvent.setup();

    // Mock first page
    mockEmployeeApi.getAll.mockResolvedValueOnce({
      content: [mockEmployees[0]],
      totalElements: 2,
      totalPages: 2,
      size: 1,
      number: 0,
      first: true,
      last: false,
    });

    // Mock second page
    mockEmployeeApi.getAll.mockResolvedValueOnce({
      content: [mockEmployees[1]],
      totalElements: 2,
      totalPages: 2,
      size: 1,
      number: 1,
      first: false,
      last: true,
    });

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByLabelText(/next page/i);
    await user.click(nextButton);

    // Verify second page loads
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify API calls
    expect(mockEmployeeApi.getAll).toHaveBeenCalledTimes(2);
    expect(mockEmployeeApi.getAll).toHaveBeenNthCalledWith(1, {
      page: 0,
      size: 10,
    });
    expect(mockEmployeeApi.getAll).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 10,
    });
  });
});
