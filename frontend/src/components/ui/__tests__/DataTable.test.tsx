import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DataTable } from '../DataTable';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
];

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

describe('DataTable', () => {
  const mockOnSort = vi.fn();
  const mockOnPageChange = vi.fn();
  const mockOnRowSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data', () => {
    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('handles sorting when column header is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
        />
      </TestWrapper>
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('shows loading state', () => {
    render(
      <TestWrapper>
        <DataTable
          data={[]}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
          loading={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <TestWrapper>
        <DataTable
          data={[]}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles row selection', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
          onRowSelect={mockOnRowSelect}
          selectable
        />
      </TestWrapper>
    );

    const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    await user.click(firstCheckbox);

    expect(mockOnRowSelect).toHaveBeenCalledWith([1]);
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
          pagination={{
            page: 1,
            pageSize: 2,
            total: 10,
          }}
        />
      </TestWrapper>
    );

    const nextButton = screen.getByLabelText('Next page');
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('applies custom row className', () => {
    const getRowClassName = vi.fn(() => 'custom-row');

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
          getRowClassName={getRowClassName}
        />
      </TestWrapper>
    );

    expect(getRowClassName).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('renders custom cell content', () => {
    const customColumns = [
      {
        key: 'name',
        label: 'Name',
        render: (value: string, row: any) => <strong>{value}</strong>,
      },
      { key: 'email', label: 'Email' },
    ];

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={customColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
        />
      </TestWrapper>
    );

    const strongElement = screen.getByText('John Doe').closest('strong');
    expect(strongElement).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(
      <TestWrapper>
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={mockOnSort}
          onPageChange={mockOnPageChange}
          onSearch={mockOnSearch}
          searchable
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('John');
    });
  });
});
