import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { EmployeesPage } from './EmployeesPage';
import { useEmployeeListState } from '../hooks/useEmployees';

// Mock the hooks and components
import { vi } from 'vitest';
vi.mock('../hooks/useEmployees');
vi.mock('../components/EmployeeList', () => ({
  EmployeeList: ({
    onCreateEmployee,
    onEditEmployee,
    onViewEmployee,
    onImportEmployees,
    onExportEmployees,
  }: any) => (
    <div data-testid="employee-list">
      <button onClick={onCreateEmployee}>Create Employee</button>
      <button
        onClick={() =>
          onEditEmployee({ id: 1, firstName: 'John', lastName: 'Doe' })
        }
      >
        Edit Employee
      </button>
      <button
        onClick={() =>
          onViewEmployee({ id: 1, firstName: 'John', lastName: 'Doe' })
        }
      >
        View Employee
      </button>
      <button onClick={onImportEmployees}>Import Employees</button>
      <button onClick={onExportEmployees}>Export Employees</button>
    </div>
  ),
}));

vi.mock('../components/EmployeeImport', () => ({
  EmployeeImport: ({ opened, onClose, onSuccess }: any) => (
    <div
      data-testid="employee-import"
      style={{ display: opened ? 'block' : 'none' }}
    >
      <button onClick={onClose}>Close Import</button>
      <button
        onClick={() =>
          onSuccess([{ id: 1, firstName: 'John', lastName: 'Doe' }])
        }
      >
        Success Import
      </button>
    </div>
  ),
}));

vi.mock('../components/EmployeeExport', () => ({
  EmployeeExport: ({ opened, onClose, selectedEmployees }: any) => (
    <div
      data-testid="employee-export"
      style={{ display: opened ? 'block' : 'none' }}
    >
      <span>Selected: {selectedEmployees?.length || 0}</span>
      <button onClick={onClose}>Close Export</button>
    </div>
  ),
}));

const mockUseEmployeeListState = useEmployeeListState as any;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Notifications />
          {children}
        </MantineProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmployeeListState.mockReturnValue({
      pageable: { page: 0, size: 10 },
      searchCriteria: {},
      selectedEmployees: [1, 2],
      setSelectedEmployees: vi.fn(),
      updatePageable: vi.fn(),
      updateSearchCriteria: vi.fn(),
      clearSearch: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <TestWrapper>
        <EmployeesPage />
      </TestWrapper>
    );
  };

  it('renders the employees page with title and employee list', () => {
    renderComponent();

    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByTestId('employee-list')).toBeInTheDocument();
  });

  it('navigates to create employee page when create is clicked', () => {
    renderComponent();

    const createButton = screen.getByText('Create Employee');
    fireEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/employees/new');
  });

  it('navigates to edit employee page when edit is clicked', () => {
    renderComponent();

    const editButton = screen.getByText('Edit Employee');
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/employees/1/edit');
  });

  it('navigates to view employee page when view is clicked', () => {
    renderComponent();

    const viewButton = screen.getByText('View Employee');
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/employees/1');
  });

  it('opens import modal when import is clicked', () => {
    renderComponent();

    // Initially import modal should be hidden
    const importModal = screen.getByTestId('employee-import');
    expect(importModal).toHaveStyle('display: none');

    // Click import button
    const importButton = screen.getByText('Import Employees');
    fireEvent.click(importButton);

    // Import modal should be visible
    expect(importModal).toHaveStyle('display: block');
  });

  it('opens export modal when export is clicked', () => {
    renderComponent();

    // Initially export modal should be hidden
    const exportModal = screen.getByTestId('employee-export');
    expect(exportModal).toHaveStyle('display: none');

    // Click export button
    const exportButton = screen.getByText('Export Employees');
    fireEvent.click(exportButton);

    // Export modal should be visible
    expect(exportModal).toHaveStyle('display: block');
  });

  it('passes selected employees to export modal', () => {
    renderComponent();

    // Click export button to open modal
    const exportButton = screen.getByText('Export Employees');
    fireEvent.click(exportButton);

    // Check that selected employees count is displayed
    expect(screen.getByText('Selected: 2')).toBeInTheDocument();
  });

  it('closes import modal when close is clicked', () => {
    renderComponent();

    // Open import modal
    const importButton = screen.getByText('Import Employees');
    fireEvent.click(importButton);

    const importModal = screen.getByTestId('employee-import');
    expect(importModal).toHaveStyle('display: block');

    // Close import modal
    const closeButton = screen.getByText('Close Import');
    fireEvent.click(closeButton);

    expect(importModal).toHaveStyle('display: none');
  });

  it('closes export modal when close is clicked', () => {
    renderComponent();

    // Open export modal
    const exportButton = screen.getByText('Export Employees');
    fireEvent.click(exportButton);

    const exportModal = screen.getByTestId('employee-export');
    expect(exportModal).toHaveStyle('display: block');

    // Close export modal
    const closeButton = screen.getByText('Close Export');
    fireEvent.click(closeButton);

    expect(exportModal).toHaveStyle('display: none');
  });

  it('handles import success and closes modal', () => {
    renderComponent();

    // Open import modal
    const importButton = screen.getByText('Import Employees');
    fireEvent.click(importButton);

    const importModal = screen.getByTestId('employee-import');
    expect(importModal).toHaveStyle('display: block');

    // Trigger import success
    const successButton = screen.getByText('Success Import');
    fireEvent.click(successButton);

    // Modal should close
    expect(importModal).toHaveStyle('display: none');
  });

  it('renders import and export modals initially closed', () => {
    renderComponent();

    const importModal = screen.getByTestId('employee-import');
    const exportModal = screen.getByTestId('employee-export');

    expect(importModal).toHaveStyle('display: none');
    expect(exportModal).toHaveStyle('display: none');
  });
});
