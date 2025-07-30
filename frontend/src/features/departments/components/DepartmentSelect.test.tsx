/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DepartmentSelect, SimpleDepartmentSelect } from './DepartmentSelect';
import { type Department } from '../../../types';

// Mock the hook
vi.mock('../hooks/useDepartmentTree');

import * as departmentHooks from '../hooks/useDepartmentTree';

const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software development team',
    employeeCount: 15,
    createdAt: '2024-01-01T00:00:00Z',
    children: [
      {
        id: 2,
        name: 'Frontend',
        description: 'Frontend development',
        parentId: 1,
        employeeCount: 8,
        createdAt: '2024-01-01T00:00:00Z',
        children: [],
      },
      {
        id: 3,
        name: 'Backend',
        description: 'Backend development',
        parentId: 1,
        employeeCount: 7,
        createdAt: '2024-01-01T00:00:00Z',
        children: [],
      },
    ],
  },
  {
    id: 4,
    name: 'Marketing',
    description: 'Marketing and sales',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    children: [],
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

describe('DepartmentSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: mockDepartments,
      isLoading: false,
      error: null,
    } as any);
  });

  it('renders department options correctly', async () => {
    render(<DepartmentSelect />, { wrapper: createWrapper() });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText(/Frontend/)).toBeInTheDocument();
      expect(screen.getByText(/Backend/)).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });
  });

  it('shows employee count when enabled', async () => {
    render(<DepartmentSelect showEmployeeCount />, {
      wrapper: createWrapper(),
    });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByText('Engineering (15)')).toBeInTheDocument();
      expect(screen.getByText(/Frontend \(8\)/)).toBeInTheDocument();
      expect(screen.getByText(/Backend \(7\)/)).toBeInTheDocument();
      expect(screen.getByText('Marketing (10)')).toBeInTheDocument();
    });
  });

  it('includes root option when includeRoot is true', async () => {
    render(<DepartmentSelect includeRoot rootLabel="No Department" />, {
      wrapper: createWrapper(),
    });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByText('No Department')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });

  it('excludes specified department', async () => {
    render(<DepartmentSelect excludeId={1} />, { wrapper: createWrapper() });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      // Children of excluded department should still be visible
      expect(screen.getByText(/Frontend/)).toBeInTheDocument();
      expect(screen.getByText(/Backend/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<DepartmentSelect />, { wrapper: createWrapper() });

    expect(
      screen.getByPlaceholderText('Loading departments...')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Loading departments...')
    ).toHaveAttribute('disabled');
  });

  it('shows error state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    render(<DepartmentSelect />, { wrapper: createWrapper() });

    expect(
      screen.getByPlaceholderText('Error loading departments')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Error loading departments')
    ).toHaveAttribute('disabled');
  });

  it('handles selection correctly', async () => {
    const mockOnChange = vi.fn();
    render(<DepartmentSelect onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      const engineeringOption = screen.getByText('Engineering');
      fireEvent.click(engineeringOption);
    });

    expect(mockOnChange).toHaveBeenCalledWith('1', expect.any(Object));
  });

  it('is searchable', async () => {
    render(<DepartmentSelect />, { wrapper: createWrapper() });

    const select = screen.getByRole('textbox');
    fireEvent.change(select, { target: { value: 'Front' } });

    await waitFor(() => {
      // Should filter to show only Frontend
      expect(screen.getByText(/Frontend/)).toBeInTheDocument();
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
      expect(screen.queryByText('Marketing')).not.toBeInTheDocument();
    });
  });

  it('is clearable', async () => {
    const mockOnChange = vi.fn();
    render(<DepartmentSelect value="1" onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    // Find and click the clear button
    const clearButton = screen.getByLabelText('Clear select');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null, expect.any(Object));
  });
});

describe('SimpleDepartmentSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: mockDepartments,
      isLoading: false,
      error: null,
    } as any);
  });

  it('renders simplified department options', async () => {
    render(<SimpleDepartmentSelect />, { wrapper: createWrapper() });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText(/Frontend/)).toBeInTheDocument();
      expect(screen.getByText(/Backend/)).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });
  });

  it('does not show employee count', async () => {
    render(<SimpleDepartmentSelect />, { wrapper: createWrapper() });

    const select = screen.getByRole('textbox');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.queryByText('Engineering (15)')).not.toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<SimpleDepartmentSelect />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Loading...')).toHaveAttribute(
      'disabled'
    );
  });

  it('shows error state', () => {
    vi.mocked(departmentHooks.useDepartmentTree).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    render(<SimpleDepartmentSelect />, { wrapper: createWrapper() });

    expect(
      screen.getByPlaceholderText('Error loading departments')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Error loading departments')
    ).toHaveAttribute('disabled');
  });
});
