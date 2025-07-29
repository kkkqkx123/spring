import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDepartmentTree,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useMoveDepartment,
  useDepartmentEmployees,
} from './useDepartmentTree';
import { DepartmentApi } from '../services/departmentApi';
import type { Department } from '../../../types';

// Mock the API
vi.mock('../services/departmentApi');
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const mockDepartmentApi = vi.mocked(DepartmentApi);

const mockDepartment: Department = {
  id: 1,
  name: 'Engineering',
  description: 'Software development team',
  employeeCount: 15,
  createdAt: '2024-01-01T00:00:00Z',
  children: [],
};

const mockDepartments: Department[] = [mockDepartment];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDepartmentTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches department tree successfully', async () => {
    mockDepartmentApi.getDepartmentTree.mockResolvedValue(mockDepartments);

    const { result } = renderHook(() => useDepartmentTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDepartments);
    expect(mockDepartmentApi.getDepartmentTree).toHaveBeenCalledTimes(1);
  });

  it('handles error when fetching department tree', async () => {
    const error = new Error('Failed to fetch');
    mockDepartmentApi.getDepartmentTree.mockRejectedValue(error);

    const { result } = renderHook(() => useDepartmentTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single department successfully', async () => {
    mockDepartmentApi.getDepartment.mockResolvedValue(mockDepartment);

    const { result } = renderHook(() => useDepartment(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDepartment);
    expect(mockDepartmentApi.getDepartment).toHaveBeenCalledWith(1);
  });

  it('does not fetch when id is not provided', () => {
    const { result } = renderHook(() => useDepartment(0), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockDepartmentApi.getDepartment).not.toHaveBeenCalled();
  });
});

describe('useCreateDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates department successfully', async () => {
    const newDepartment = { name: 'New Department', description: 'Test' };
    mockDepartmentApi.createDepartment.mockResolvedValue(mockDepartment);

    const { result } = renderHook(() => useCreateDepartment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newDepartment);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDepartmentApi.createDepartment).toHaveBeenCalledWith(
      newDepartment
    );
  });

  it('handles error when creating department', async () => {
    const error = {
      response: {
        data: {
          message: 'Department name already exists',
        },
      },
    };
    mockDepartmentApi.createDepartment.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateDepartment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'Duplicate' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUpdateDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates department successfully', async () => {
    const updateData = {
      id: 1,
      name: 'Updated Department',
      description: 'Updated',
    };
    mockDepartmentApi.updateDepartment.mockResolvedValue(mockDepartment);

    const { result } = renderHook(() => useUpdateDepartment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(updateData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDepartmentApi.updateDepartment).toHaveBeenCalledWith(updateData);
  });
});

describe('useDeleteDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes department successfully', async () => {
    mockDepartmentApi.deleteDepartment.mockResolvedValue();

    const { result } = renderHook(() => useDeleteDepartment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDepartmentApi.deleteDepartment).toHaveBeenCalledWith(1);
  });
});

describe('useMoveDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves department successfully', async () => {
    const moveRequest = { departmentId: 1, newParentId: 2 };
    mockDepartmentApi.moveDepartment.mockResolvedValue(mockDepartment);

    const { result } = renderHook(() => useMoveDepartment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(moveRequest);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDepartmentApi.moveDepartment).toHaveBeenCalledWith(moveRequest);
  });
});

describe('useDepartmentEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches department employees successfully', async () => {
    const mockEmployees = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];
    mockDepartmentApi.getDepartmentEmployees.mockResolvedValue(mockEmployees);

    const { result } = renderHook(() => useDepartmentEmployees(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEmployees);
    expect(mockDepartmentApi.getDepartmentEmployees).toHaveBeenCalledWith(1);
  });

  it('does not fetch when id is not provided', () => {
    const { result } = renderHook(() => useDepartmentEmployees(0), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockDepartmentApi.getDepartmentEmployees).not.toHaveBeenCalled();
  });
});
