import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useEmployees, useEmployee, useEmployeeSearch, useEmployeeListState } from './useEmployees';
import { employeeApi } from '../services/employeeApi';
import { type Employee } from '../../../types';

// Mock the employee API
vi.mock('../services/employeeApi', () => ({
  employeeApi: {
    getEmployees: vi.fn(),
    getEmployee: vi.fn(),
    searchEmployees: vi.fn(),
    deleteEmployees: vi.fn(),
    exportEmployees: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches employees successfully', async () => {
    const mockEmployee: Employee = {
      id: 1,
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
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
    };

    const mockResponse = {
      content: [mockEmployee],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    vi.mocked(employeeApi.getEmployees).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useEmployees({ page: 0, size: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(employeeApi.getEmployees).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('handles error when fetching employees fails', async () => {
    const mockError = new Error('Failed to fetch employees');
    vi.mocked(employeeApi.getEmployees).mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useEmployees({ page: 0, size: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useEmployee', () => {
  it('fetches single employee successfully', async () => {
    const mockEmployee: Employee = {
      id: 1,
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
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
    };

    vi.mocked(employeeApi.getEmployee).mockResolvedValue(mockEmployee);

    const { result } = renderHook(
      () => useEmployee(1),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEmployee);
    expect(employeeApi.getEmployee).toHaveBeenCalledWith(1);
  });

  it('does not fetch when id is not provided', () => {
    vi.clearAllMocks(); // Clear previous test mocks
    
    const { result } = renderHook(
      () => useEmployee(0),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(employeeApi.getEmployee).not.toHaveBeenCalled();
  });
});

describe('useEmployeeSearch', () => {
  it('searches employees with criteria', async () => {
    const mockEmployee: Employee = {
      id: 1,
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
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
    };

    const mockResponse = {
      content: [mockEmployee],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    vi.mocked(employeeApi.searchEmployees).mockResolvedValue(mockResponse);

    const criteria = { name: 'John' };
    const pageable = { page: 0, size: 10 };

    const { result } = renderHook(
      () => useEmployeeSearch(criteria, pageable),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(employeeApi.searchEmployees).toHaveBeenCalledWith(criteria, pageable);
  });

  it('is enabled only when criteria has values', () => {
    vi.clearAllMocks(); // Clear previous test mocks
    
    const emptyCriteria = {};
    const pageable = { page: 0, size: 10 };

    const { result } = renderHook(
      () => useEmployeeSearch(emptyCriteria, pageable),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(employeeApi.searchEmployees).not.toHaveBeenCalled();
  });
});

describe('useEmployeeListState', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useEmployeeListState());

    expect(result.current.pageable).toEqual({ page: 0, size: 10 });
    expect(result.current.searchCriteria).toEqual({});
    expect(result.current.selectedEmployees).toEqual([]);
  });

  it('updates pageable correctly', () => {
    const { result } = renderHook(() => useEmployeeListState());

    act(() => {
      result.current.updatePageable({ page: 1, size: 20 });
    });

    expect(result.current.pageable).toEqual({ page: 1, size: 20 });
  });

  it('updates search criteria and resets page', () => {
    const { result } = renderHook(() => useEmployeeListState());

    // First set page to 1
    act(() => {
      result.current.updatePageable({ page: 1 });
    });
    expect(result.current.pageable.page).toBe(1);

    // Then update search criteria - should reset page to 0
    act(() => {
      result.current.updateSearchCriteria({ name: 'John' });
    });

    expect(result.current.searchCriteria).toEqual({ name: 'John' });
    expect(result.current.pageable.page).toBe(0);
  });

  it('clears search criteria and resets page', () => {
    const { result } = renderHook(() => useEmployeeListState());

    // Set some search criteria and page
    act(() => {
      result.current.updateSearchCriteria({ name: 'John' });
      result.current.updatePageable({ page: 2 });
    });

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchCriteria).toEqual({});
    expect(result.current.pageable.page).toBe(0);
  });

  it('manages selected employees', () => {
    const { result } = renderHook(() => useEmployeeListState());

    act(() => {
      result.current.setSelectedEmployees([1, 2, 3]);
    });

    expect(result.current.selectedEmployees).toEqual([1, 2, 3]);
  });
});