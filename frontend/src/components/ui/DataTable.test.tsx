import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { DataTable } from './DataTable';
import { DataTableColumn } from '../../types';

// Test data
interface TestData {
  id: number;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
}

const testData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, status: 'inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, status: 'active' },
];

const testColumns: DataTableColumn<TestData>[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'age', title: 'Age', sortable: true },
  { 
    key: 'status', 
    title: 'Status', 
    render: (value) => (
      <span style={{ color: value === 'active' ? 'green' : 'red' }}>
        {value}
      </span>
    )
  },
];

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('DataTable', () => {
  it('renders table with data', () => {
    renderWithProvider(
      <DataTable data={testData} columns={testColumns} />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithProvider(
      <DataTable data={[]} columns={testColumns} loading={true} />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    renderWithProvider(
      <DataTable data={[]} columns={testColumns} />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <DataTable data={testData} columns={testColumns} />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'john');

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('handles sorting functionality', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <DataTable data={testData} columns={testColumns} />
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    // Check if data is sorted (Bob should be first alphabetically)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bob Johnson');
  });

  it('handles row selection', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    renderWithProvider(
      <DataTable 
        data={testData} 
        columns={testColumns}
        rowSelection={{
          selectedRowKeys: [],
          onChange: mockOnChange
        }}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Click first data row checkbox

    expect(mockOnChange).toHaveBeenCalledWith([0], [testData[0]]);
  });

  it('handles select all functionality', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    renderWithProvider(
      <DataTable 
        data={testData} 
        columns={testColumns}
        rowSelection={{
          selectedRowKeys: [],
          onChange: mockOnChange
        }}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith([0, 1, 2], testData);
  });

  it('renders custom cell content', () => {
    renderWithProvider(
      <DataTable data={testData} columns={testColumns} />
    );

    // Check if custom render function is applied to status column
    const activeStatus = screen.getAllByText('active')[0];
    expect(activeStatus).toHaveStyle({ color: 'rgb(0, 128, 0)' });
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    renderWithProvider(
      <DataTable 
        data={testData} 
        columns={testColumns}
        pagination={{
          current: 1,
          pageSize: 2,
          total: 3,
          onChange: mockOnChange
        }}
      />
    );

    expect(screen.getByText('Showing 1 to 2 of 3 entries')).toBeInTheDocument();
    
    // Test pagination navigation
    const page2Button = screen.getByRole('button', { name: '2' });
    await user.click(page2Button);

    expect(mockOnChange).toHaveBeenCalledWith(2, 2);
  });

  it('handles non-sortable columns', async () => {
    const user = userEvent.setup();
    const nonSortableColumns = [
      { key: 'name', title: 'Name', sortable: false },
      { key: 'email', title: 'Email', sortable: true },
    ];

    renderWithProvider(
      <DataTable data={testData} columns={nonSortableColumns} />
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    // Should not show sort icon for non-sortable column
    expect(nameHeader.parentElement).not.toHaveTextContent('↑');
    expect(nameHeader.parentElement).not.toHaveTextContent('↓');
  });

  it('maintains accessibility attributes', () => {
    renderWithProvider(
      <DataTable 
        data={testData} 
        columns={testColumns}
        rowSelection={{
          selectedRowKeys: [],
          onChange: vi.fn()
        }}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    expect(selectAllCheckbox).toHaveAttribute('aria-label', 'Select all rows');

    const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
    expect(firstRowCheckbox).toHaveAttribute('aria-label', 'Select row 1');
  });
});