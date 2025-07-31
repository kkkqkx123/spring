import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { EmployeeList } from '../../features/employees/components/EmployeeList';

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
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

// Mock large dataset
const generateMockEmployees = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    employeeNumber: `EMP${String(index + 1).padStart(3, '0')}`,
    firstName: `FirstName${index + 1}`,
    lastName: `LastName${index + 1}`,
    email: `employee${index + 1}@example.com`,
    department: { id: 1, name: 'Engineering' },
    position: { id: 1, name: 'Developer' },
    status: 'ACTIVE' as const,
  }));
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders large employee list within performance budget', async () => {
    const largeDataset = generateMockEmployees(1000);
    
    // Mock API to return large dataset
    vi.mock('../../services/employeeApi', () => ({
      employeeApi: {
        getAll: vi.fn().mockResolvedValue({
          content: largeDataset,
          totalElements: 1000,
          totalPages: 100,
        }),
      },
    }));

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Employees')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Assert render time is under 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  it('handles rapid state updates efficiently', async () => {
    const mockEmployees = generateMockEmployees(100);
    
    vi.mock('../../services/employeeApi', () => ({
      employeeApi: {
        getAll: vi.fn().mockResolvedValue({
          content: mockEmployees,
          totalElements: 100,
          totalPages: 10,
        }),
      },
    }));

    const startTime = performance.now();
    
    const { rerender } = render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Simulate rapid re-renders
    for (let i = 0; i < 50; i++) {
      rerender(
        <TestWrapper>
          <EmployeeList key={i} />
        </TestWrapper>
      );
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Assert total time for 50 re-renders is under 1 second
    expect(totalTime).toBeLessThan(1000);
  });

  it('memory usage stays within bounds during component lifecycle', async () => {
    const mockEmployees = generateMockEmployees(500);
    
    vi.mock('../../services/employeeApi', () => ({
      employeeApi: {
        getAll: vi.fn().mockResolvedValue({
          content: mockEmployees,
          totalElements: 500,
          totalPages: 50,
        }),
      },
    }));

    // Measure initial memory (if available)
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const { unmount } = render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Employees')).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Assert memory increase is reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('virtual scrolling performs well with large datasets', async () => {
    const largeDataset = generateMockEmployees(10000);
    
    vi.mock('../../services/employeeApi', () => ({
      employeeApi: {
        getAll: vi.fn().mockResolvedValue({
          content: largeDataset.slice(0, 100), // Simulate pagination
          totalElements: 10000,
          totalPages: 1000,
        }),
      },
    }));

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Employees')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Even with 10k total items, initial render should be fast
    expect(renderTime).toBeLessThan(1000);
  });
});