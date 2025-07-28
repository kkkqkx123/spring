import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { EmployeeSearch } from './EmployeeSearch';
import { Department, Position } from '../../../types';

const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software Development',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Marketing',
    description: 'Marketing and Sales',
    employeeCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockPositions: Position[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Develops software',
    departmentId: 1,
  },
  {
    id: 2,
    title: 'Marketing Manager',
    description: 'Manages marketing',
    departmentId: 2,
  },
];

const defaultProps = {
  onSearch: vi.fn(),
  onClear: vi.fn(),
  departments: mockDepartments,
  positions: mockPositions,
  loading: false,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('EmployeeSearch', () => {
  const renderWithWrapper = (props = defaultProps) => {
    return render(
      <TestWrapper>
        <EmployeeSearch {...props} />
      </TestWrapper>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic search input', () => {
    renderWithWrapper();
    
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('calls onSearch with name criteria when form is submitted', async () => {
    renderWithWrapper();
    
    const nameInput = screen.getByPlaceholderText('Search by name...');
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        name: 'John Doe',
      });
    });
  });

  it('shows advanced search when toggle is clicked', async () => {
    renderWithWrapper();
    
    const toggleButton = screen.getByLabelText('Toggle advanced search');
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Department')).toBeInTheDocument();
      expect(screen.getByLabelText('Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  it('includes advanced criteria in search', async () => {
    renderWithWrapper();
    
    // Open advanced search
    const toggleButton = screen.getByLabelText('Toggle advanced search');
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
    
    // Fill in advanced fields
    const emailInput = screen.getByLabelText('Email');
    const departmentSelect = screen.getByLabelText('Department');
    const statusSelect = screen.getByLabelText('Status');
    
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(departmentSelect);
    
    await waitFor(() => {
      const engineeringOption = screen.getByText('Engineering');
      fireEvent.click(engineeringOption);
    });
    
    fireEvent.click(statusSelect);
    await waitFor(() => {
      const activeOption = screen.getByText('Active');
      fireEvent.click(activeOption);
    });
    
    // Submit search
    const searchButton = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        email: 'john@example.com',
        departmentId: 1,
        status: 'ACTIVE',
      });
    });
  });

  it('shows clear button when there are active filters', async () => {
    renderWithWrapper();
    
    const nameInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });
  });

  it('calls onClear when clear button is clicked', async () => {
    renderWithWrapper();
    
    const nameInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: 'Clear' });
      fireEvent.click(clearButton);
    });
    
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('filters out empty values from search criteria', async () => {
    renderWithWrapper();
    
    const nameInput = screen.getByPlaceholderText('Search by name...');
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    // Leave name empty but submit
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith({});
    });
  });

  it('shows loading state on search button', () => {
    renderWithWrapper({ ...defaultProps, loading: true });
    
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeDisabled();
  });

  it('populates initial values correctly', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'ACTIVE',
    };
    
    renderWithWrapper({ ...defaultProps, initialValues });
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });
});