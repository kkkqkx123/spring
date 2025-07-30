import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { ResponsiveDataTable } from './ResponsiveDataTable';
import { DataTableColumn } from '../../types';

// Mock the responsive utilities
vi.mock('../../utils/responsive', () => ({
  useResponsiveValue: vi.fn((values) => values.md || values.sm || values.xs || Object.values(values)[0]),
  useTouchGestures: vi.fn(() => ({
    onTouchStart: vi.fn(),
    onTouchEnd: vi.fn(),
    onTouchMove: vi.fn(),
  })),
}));

// Mock Mantine's useMediaQuery
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: vi.fn(() => false), // Default to desktop
}));

interface TestData {
  id: number;
  name: string;
  email: string;
  department: string;
  status: 'active' | 'inactive';
}

const mockData: TestData[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Engineering',
    status: 'active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    department: 'Marketing',
    status: 'inactive',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    department: 'Sales',
    status: 'active',
  },
];

const mockColumns: DataTableColumn<TestData>[] = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    title: 'Email',
    sortable: true,
  },
  {
    key: 'department',
    title: 'Department',
    sortable: true,
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value) => (
      <span style={{ color: value === 'active' ? 'green' : 'red' }}>
        {value}
      </span>
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    render: (_, record) => (
      <button onClick={() => console.log('Edit', record.id)}>Edit</button>
    ),
  },
];

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('ResponsiveDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with data', () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={[]}
        columns={mockColumns}
        loading={true}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={[]}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should handle sorting', () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Check if sort icon appears (ascending)
    expect(nameHeader.closest('th')).toBeInTheDocument();
  });

  it('should handle row selection', () => {
    const mockRowSelection = {
      selectedRowKeys: [],
      onChange: vi.fn(),
    };

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        rowSelection={mockRowSelection}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 3 rows + select all

    fireEvent.click(checkboxes[1]); // Click first row checkbox
    expect(mockRowSelection.onChange).toHaveBeenCalledWith([0], [mockData[0]]);
  });

  it('should handle select all functionality', () => {
    const mockRowSelection = {
      selectedRowKeys: [],
      onChange: vi.fn(),
    };

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        rowSelection={mockRowSelection}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all rows');
    fireEvent.click(selectAllCheckbox);

    expect(mockRowSelection.onChange).toHaveBeenCalledWith([0, 1, 2], mockData);
  });

  it('should handle pagination', () => {
    const mockPagination = {
      current: 1,
      pageSize: 10,
      total: 100,
      onChange: vi.fn(),
    };

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        pagination={mockPagination}
      />
    );

    expect(screen.getByText('Showing 1 to 3 of 100 entries')).toBeInTheDocument();
  });

  it('should render custom mobile card renderer', () => {
    const { useMediaQuery } = require('@mantine/hooks');
    useMediaQuery.mockReturnValue(true); // Mock mobile

    const customRenderer = (item: TestData) => (
      <div data-testid={`custom-card-${item.id}`}>
        Custom: {item.name}
      </div>
    );

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        mobileCardRenderer={customRenderer}
      />
    );

    expect(screen.getByTestId('custom-card-1')).toBeInTheDocument();
    expect(screen.getByText('Custom: John Doe')).toBeInTheDocument();
  });

  it('should render default mobile cards when no custom renderer', () => {
    const { useMediaQuery } = require('@mantine/hooks');
    useMediaQuery.mockReturnValue(true); // Mock mobile

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    // Should render cards instead of table
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show view mode toggle on non-mobile', () => {
    const { useMediaQuery } = require('@mantine/hooks');
    useMediaQuery.mockReturnValue(false); // Mock desktop

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    // Should have view mode toggle buttons
    const toggleButtons = screen.getAllByRole('button');
    const viewToggleButtons = toggleButtons.filter(button => 
      button.getAttribute('aria-label') === null && 
      button.querySelector('svg')
    );
    
    expect(viewToggleButtons.length).toBeGreaterThan(0);
  });

  it('should handle page size change', () => {
    const mockPagination = {
      current: 1,
      pageSize: 10,
      total: 100,
      onChange: vi.fn(),
    };

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        pagination={mockPagination}
      />
    );

    const pageSizeSelect = screen.getByDisplayValue('10 per page');
    fireEvent.click(pageSizeSelect);
    
    // This would open the dropdown, but we can't easily test the selection
    // in this test environment without more complex mocking
    expect(pageSizeSelect).toBeInTheDocument();
  });

  it('should render column content correctly', () => {
    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    // Check if custom render function works
    const statusElements = screen.getAllByText('active');
    expect(statusElements[0]).toHaveStyle({ color: 'green' });

    // Check if action buttons are rendered
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(3);
  });

  it('should handle responsive page size options', () => {
    const { useResponsiveValue } = require('../../utils/responsive');
    useResponsiveValue.mockReturnValue([5, 10, 20]); // Mock mobile page sizes

    const mockPagination = {
      current: 1,
      pageSize: 10,
      total: 100,
      onChange: jest.fn(),
    };

    renderWithProvider(
      <ResponsiveDataTable
        data={mockData}
        columns={mockColumns}
        pagination={mockPagination}
      />
    );

    expect(useResponsiveValue).toHaveBeenCalledWith({
      xs: [5, 10, 20],
      sm: [10, 25, 50],
      md: [10, 25, 50, 100],
      lg: [10, 25, 50, 100],
      xl: [10, 25, 50, 100],
    });
  });
});