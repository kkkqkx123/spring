import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { EmployeeList } from './EmployeeList';
import { Employee, PaginatedResponse } from '../../../types';

// Mock the hooks
vi.mock('../hooks/useEmployees');
vi.mock('../../departments/hooks/useDepartments');
vi.mock('../../positions/hooks/usePositions');

const mockEmployees: Employee[] = [
  {
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
  },
  {
    id: 2,
    employeeNumber: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    department: {
      id: 2,
      name: 'Marketing',
      description: 'Marketing and Sales',
      employeeCount: 5,
      createdAt: '2024-01-01T00:00:00Z',
    },
    position: {
      id: 2,
      title: 'Marketing Manager',
      description: 'Manages marketing',
      departmentId: 2,
    },
    hireDate: '2024-02-01T00:00:00Z',
    status: 'ACTIVE',
  },
];

const mockPaginatedResponse: PaginatedResponse<Employee> = {
  content: mockEmployees,
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

const mockDepartments = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software Development',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockPositions = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Develops software',
    departmentId: 1,
  },
];

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
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

const defaultProps = {
  onCreateEmployee: vi.fn(),
  onEditEmployee: vi.fn(),
  onViewEmployee: vi.fn(),
  onImportEmployees: vi.fn(),
};

// Import the mocked modules
import * as employeeHooks from '../hooks/useEmployees';
import * as departmentHooks from '../../departments/hooks/useDepartments';
import * as positionHooks from '../../positions/hooks/usePositions';

describe('EmployeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(employeeHooks.useEmployeeListState).mockReturnValue({
      pageable: { page: 0, size: 10 },
      searchCriteria: {},
      selectedEmployees: [],
      setSelectedEmployees: vi.fn(),
      updatePageable: vi.fn(),
      updateSearchCriteria: vi.fn(),
      clearSearch: vi.fn(),
    });
    
    vi.mocked(employeeHooks.useEmployees).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
    });
    
    vi.mocked(employeeHooks.useEmployeeSearch).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    
    vi.mocked(employeeHooks.useDeleteEmployees).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    
    vi.mocked(employeeHooks.useEmployeeExport).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    
    vi.mocked(departmentHooks.useDepartments).mockReturnValue({
      data: mockDepartments,
    });
    
    vi.mocked(positionHooks.usePositions).mockReturnValue({
      data: mockPositions,
    });
  });

  it('renders employee list in table view by default', () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    vi.mocked(employeeHooks.useEmployees).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Loading employees...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    vi.mocked(employeeHooks.useEmployees).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });
    
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Failed to load employees. Please try again.')).toBeInTheDocument();
  });

  it('shows Add Employee button when onCreateEmployee is provided', () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument();
  });

  it('calls onCreateEmployee when Add Employee button is clicked', () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    const addButton = screen.getByRole('button', { name: 'Add Employee' });
    fireEvent.click(addButton);
    
    expect(defaultProps.onCreateEmployee).toHaveBeenCalled();
  });

  it('switches between table and grid view', async () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    // Should be in table view by default
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Switch to grid view
    const gridViewButton = screen.getByRole('radio', { name: '' }); // Grid icon button
    fireEvent.click(gridViewButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      // Should show employee cards instead
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows employee count', () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('2 employees')).toBeInTheDocument();
  });

  it('shows singular employee text for one employee', () => {
    vi.mocked(employeeHooks.useEmployees).mockReturnValue({
      data: {
        ...mockPaginatedResponse,
        content: [mockEmployees[0]],
        totalElements: 1,
      },
      isLoading: false,
      error: null,
    });
    
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('1 employee')).toBeInTheDocument();
  });

  it('shows bulk actions when employees are selected', () => {
    vi.mocked(employeeHooks.useEmployeeListState).mockReturnValue({
      pageable: { page: 0, size: 10 },
      searchCriteria: {},
      selectedEmployees: [1, 2],
      setSelectedEmployees: vi.fn(),
      updatePageable: vi.fn(),
      updateSearchCriteria: vi.fn(),
      clearSearch: vi.fn(),
    });
    
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Delete (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Selected' })).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button is clicked', async () => {
    vi.mocked(employeeHooks.useEmployeeListState).mockReturnValue({
      pageable: { page: 0, size: 10 },
      searchCriteria: {},
      selectedEmployees: [1],
      setSelectedEmployees: vi.fn(),
      updatePageable: vi.fn(),
      updateSearchCriteria: vi.fn(),
      clearSearch: vi.fn(),
    });
    
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    const deleteButton = screen.getByRole('button', { name: 'Delete (1)' });
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText('Delete Employees')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete 1 employee/)).toBeInTheDocument();
    });
  });

  it('renders search component', () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
  });

  it('shows More Actions menu', async () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    const moreActionsButton = screen.getByRole('button', { name: 'More Actions' });
    fireEvent.click(moreActionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Import Employees')).toBeInTheDocument();
      expect(screen.getByText('Export All')).toBeInTheDocument();
    });
  });

  it('calls onImportEmployees when Import Employees is clicked', async () => {
    render(
      <TestWrapper>
        <EmployeeList {...defaultProps} />
      </TestWrapper>
    );
    
    const moreActionsButton = screen.getByRole('button', { name: 'More Actions' });
    fireEvent.click(moreActionsButton);
    
    await waitFor(() => {
      const importButton = screen.getByText('Import Employees');
      fireEvent.click(importButton);
    });
    
    expect(defaultProps.onImportEmployees).toHaveBeenCalled();
  });
});