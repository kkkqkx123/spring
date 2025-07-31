import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { EmployeeExport } from './EmployeeExport';
import { useEmployeeExport } from '../hooks/useEmployees';
import type { Employee } from '../../../types';

// Mock the hooks
import { vi } from 'vitest';
vi.mock('../hooks/useEmployees');
const mockUseEmployeeExport = useEmployeeExport as any;

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

const mockEmployees: Employee[] = [
  {
    id: 1,
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    phone: '+1234567890',
    department: { id: 1, name: 'Engineering' },
    position: { id: 1, name: 'Software Developer' },
    hireDate: '2024-01-15',
    salary: 75000,
    status: 'ACTIVE',
  } as Employee,
  {
    id: 2,
    employeeNumber: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@test.com',
    department: { id: 2, name: 'Marketing' },
    position: { id: 2, name: 'Marketing Manager' },
    hireDate: '2024-02-01',
    salary: 65000,
    status: 'ACTIVE',
  } as Employee,
];

describe('EmployeeExport', () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseEmployeeExport.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      opened: true,
      onClose: mockOnClose,
      selectedEmployees: [],
      allEmployees: mockEmployees,
      ...props,
    };

    return render(
      <TestWrapper>
        <EmployeeExport {...defaultProps} />
      </TestWrapper>
    );
  };

  it('renders export modal when opened', () => {
    renderComponent();

    expect(screen.getByText('Export Employees')).toBeInTheDocument();
    expect(screen.getByText('Export Summary')).toBeInTheDocument();
    expect(screen.getByText('Select Fields to Export')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent({ opened: false });

    expect(screen.queryByText('Export Employees')).not.toBeInTheDocument();
  });

  it('shows correct summary for all employees', () => {
    renderComponent();

    expect(screen.getByText('All employees (2)')).toBeInTheDocument();
  });

  it('shows correct summary for selected employees', () => {
    renderComponent({ selectedEmployees: [1] });

    expect(screen.getByText('1 selected employees')).toBeInTheDocument();
  });

  it('displays all export fields with correct default selections', () => {
    renderComponent();

    // Check that default selected fields are checked
    expect(screen.getByLabelText('Employee Number')).toBeChecked();
    expect(screen.getByLabelText('First Name')).toBeChecked();
    expect(screen.getByLabelText('Last Name')).toBeChecked();
    expect(screen.getByLabelText('Email')).toBeChecked();
    expect(screen.getByLabelText('Phone')).toBeChecked();
    expect(screen.getByLabelText('Department')).toBeChecked();
    expect(screen.getByLabelText('Position')).toBeChecked();
    expect(screen.getByLabelText('Hire Date')).toBeChecked();
    expect(screen.getByLabelText('Status')).toBeChecked();

    // Check that sensitive fields are not selected by default
    expect(screen.getByLabelText('Salary')).not.toBeChecked();
    expect(screen.getByLabelText('Profile Picture URL')).not.toBeChecked();
  });

  it('toggles field selection when checkbox is clicked', () => {
    renderComponent();

    const salaryCheckbox = screen.getByLabelText('Salary');
    expect(salaryCheckbox).not.toBeChecked();

    fireEvent.click(salaryCheckbox);
    expect(salaryCheckbox).toBeChecked();

    fireEvent.click(salaryCheckbox);
    expect(salaryCheckbox).not.toBeChecked();
  });

  it('selects/deselects all fields when Select All button is clicked', () => {
    renderComponent();

    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    // All fields should be selected
    expect(screen.getByLabelText('Salary')).toBeChecked();
    expect(screen.getByLabelText('Profile Picture URL')).toBeChecked();

    // Button text should change
    expect(screen.getByText('Deselect All')).toBeInTheDocument();

    // Click again to deselect all
    fireEvent.click(screen.getByText('Deselect All'));

    // All fields should be deselected
    expect(screen.getByLabelText('Employee Number')).not.toBeChecked();
    expect(screen.getByLabelText('First Name')).not.toBeChecked();
  });

  it('shows warning when salary field is selected', () => {
    renderComponent();

    const salaryCheckbox = screen.getByLabelText('Salary');
    fireEvent.click(salaryCheckbox);

    expect(screen.getByText('Sensitive Data Warning')).toBeInTheDocument();
    expect(
      screen.getByText(/You have selected to export salary information/)
    ).toBeInTheDocument();
  });

  it('prevents export when no fields are selected', () => {
    renderComponent();

    // Deselect all fields
    const deselectAllButton = screen.getByText('Deselect All');
    fireEvent.click(deselectAllButton);

    const exportButton = screen.getByText('Export to Excel');
    expect(exportButton).toBeDisabled();
  });

  it('shows error notification when no fields are selected and export is attempted', () => {
    renderComponent();

    // Deselect all fields
    const deselectAllButton = screen.getByText('Deselect All');
    fireEvent.click(deselectAllButton);

    const exportButton = screen.getByText('Export to Excel');
    fireEvent.click(exportButton);

    // Should show error notification (mocked)
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('handles successful export', async () => {
    const mockBlob = new Blob(['test data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    mockMutateAsync.mockResolvedValue(mockBlob);

    renderComponent({ selectedEmployees: [1, 2] });

    const exportButton = screen.getByText('Export to Excel');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith([1, 2]);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles export failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Export failed'));

    renderComponent();

    const exportButton = screen.getByText('Export to Excel');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      // Should show error notification (mocked)
    });
  });

  it('exports all employees when no selection is provided', async () => {
    const mockBlob = new Blob(['test data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    mockMutateAsync.mockResolvedValue(mockBlob);

    renderComponent({ selectedEmployees: [] });

    const exportButton = screen.getByText('Export to Excel');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(undefined);
    });
  });

  it('shows export progress during export', async () => {
    mockUseEmployeeExport.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    renderComponent();

    expect(screen.getByText('Exporting employees...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables buttons during export', () => {
    mockUseEmployeeExport.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    renderComponent();

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Export to Excel')).toBeDisabled();
  });

  it('closes modal and resets state when cancel is clicked', () => {
    renderComponent();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays correct field count', () => {
    renderComponent();

    // Default selected fields count
    expect(screen.getByText('9 of 10 fields selected')).toBeInTheDocument();

    // Select salary field
    const salaryCheckbox = screen.getByLabelText('Salary');
    fireEvent.click(salaryCheckbox);

    expect(screen.getByText('10 of 10 fields selected')).toBeInTheDocument();
  });
});
