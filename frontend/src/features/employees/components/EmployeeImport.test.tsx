import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { EmployeeImport } from './EmployeeImport';
import { useEmployeeImport } from '../hooks/useEmployees';

// Mock the hooks
import { vi } from 'vitest';
vi.mock('../hooks/useEmployees');
const mockUseEmployeeImport = useEmployeeImport as any;

// Mock file reader
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  onload: null as any,
  result: null,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
});

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

describe('EmployeeImport', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmployeeImport.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  const renderComponent = (opened = true) => {
    return render(
      <TestWrapper>
        <EmployeeImport
          opened={opened}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </TestWrapper>
    );
  };

  it('renders import modal when opened', () => {
    renderComponent();

    expect(screen.getByText('Import Employees')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
    expect(
      screen.getByText(/Drag and drop a file here or click to select/i)
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent(false);

    expect(screen.queryByText('Import Employees')).not.toBeInTheDocument();
  });

  it('downloads template when download button is clicked', () => {
    const link = {
      href: '',
      download: '',
      click: vi.fn(),
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation(tagName => {
      if (tagName === 'a') {
        return link as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation(node => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(node => node);

    renderComponent();

    const downloadButton = screen.getByText('Download Template');
    fireEvent.click(downloadButton);

    expect(link.download).toBe('employee_import_template.csv');
    expect(link.href).toMatch(/^blob:/);
    expect(link.click).toHaveBeenCalled();
  });

  it('handles file selection and validation', async () => {
    renderComponent();

    const file = new File(['test content'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    // Create a proper drop event with files
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    // Simulate file processing
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'mock-result' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('employees.xlsx')).toBeInTheDocument();
    });
  });

  it('rejects invalid file types', async () => {
    renderComponent();

    const file = new File(['test content'], 'employees.txt', {
      type: 'text/plain',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    // Should show error notification (mocked)
    expect(screen.queryByText('employees.txt')).not.toBeInTheDocument();
  });

  it('rejects files that are too large', async () => {
    renderComponent();

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [largeFile],
        items: [
          { kind: 'file', type: largeFile.type, getAsFile: () => largeFile },
        ],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    // Should not process the file
    expect(screen.queryByText('large.xlsx')).not.toBeInTheDocument();
  });

  it('displays validation errors', async () => {
    renderComponent();

    const file = new File(['test content'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    // Simulate file processing with validation errors
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'mock-result' } } as any);
    }

    await waitFor(() => {
      // The component should show validation errors for the mock data
      expect(screen.queryByText('Validation Errors')).toBeInTheDocument();
    });
  });

  it('handles successful import', async () => {
    const mockEmployees = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
    ];

    mockMutateAsync.mockResolvedValue(mockEmployees);
    renderComponent();

    // Simulate file selection and processing
    const file = new File(['test content'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'mock-result' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('employees.xlsx')).toBeInTheDocument();
    });

    // Click import button
    const importButton = screen.getByRole('button', { name: 'Import' });
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(file);
      expect(mockOnSuccess).toHaveBeenCalledWith(mockEmployees);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles import failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Import failed'));
    renderComponent();

    // Simulate file selection and processing
    const file = new File(['test content'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'mock-result' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('employees.xlsx')).toBeInTheDocument();
    });

    // Click import button
    const importButton = screen.getByRole('button', { name: 'Import' });
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(file);
      // Should show error notification (mocked)
    });
  });

  it('closes modal and resets state when cancel is clicked', () => {
    renderComponent();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('removes selected file when X button is clicked', async () => {
    renderComponent();

    const file = new File(['test content'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByTestId('employee-import-dropzone');

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      },
    });

    fireEvent(dropzone, dropEvent);

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'mock-result' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('employees.xlsx')).toBeInTheDocument();
    });

    // Find and click the X button to remove file
    const removeButton = screen.getByLabelText('Remove file');
    fireEvent.click(removeButton);

    expect(screen.queryByText('employees.xlsx')).not.toBeInTheDocument();
  });
});
