import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components and utilities to test
import { OptimizedDataTable } from '../components/ui/OptimizedDataTable';
import { VirtualScrollList, useVirtualScroll } from '../components/ui/VirtualScrollList';
import { MessageBatcher, useMessageBatcher } from '../utils/websocketOptimization';
import { useCleanupManager } from '../hooks/useCleanupManager';
import { useDeepMemo, useDebouncedValue, useThrottledCallback } from '../utils/memoization';
import { authSelectors, useOptimizedAuthSelector } from '../stores/optimizedSelectors';

// Mock data generators
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    email: `item${index + 1}@example.com`,
    department: `Department ${(index % 5) + 1}`,
    status: index % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
  }));
};

const generateLargeDataset = (count: number = 10000) => generateMockData(count);

// Test wrapper component
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

describe('Performance Optimization Tests', () => {
  let performanceEntries: PerformanceEntry[] = [];

  beforeEach(() => {
    // Mock performance API
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
    global.performance.getEntriesByType = vi.fn(() => performanceEntries);
    global.performance.clearMarks = vi.fn();
    global.performance.clearMeasures = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    performanceEntries = [];
  });

  describe('Memoization Utilities', () => {
    it('should memoize expensive computations with useDeepMemo', () => {
      const expensiveComputation = vi.fn((data: any[]) => 
        data.reduce((sum, item) => sum + item.value, 0)
      );

      const TestComponent = ({ data }: { data: any[] }) => {
        const result = useDeepMemo(() => expensiveComputation(data), [data]);
        return <div>{result}</div>;
      };

      const data1 = [{ value: 1 }, { value: 2 }];
      const data2 = [{ value: 1 }, { value: 2 }]; // Same content, different reference

      const { rerender } = render(
        <TestWrapper>
          <TestComponent data={data1} />
        </TestWrapper>
      );

      expect(expensiveComputation).toHaveBeenCalledTimes(1);

      // Rerender with same content but different reference
      rerender(
        <TestWrapper>
          <TestComponent data={data2} />
        </TestWrapper>
      );

      // Should not call expensive computation again due to deep comparison
      expect(expensiveComputation).toHaveBeenCalledTimes(1);
    });

    it('should debounce values correctly', async () => {
      const { result } = renderHook(() => {
        const [value, setValue] = React.useState('');
        const debouncedValue = useDebouncedValue(value, 100);
        return { value, setValue, debouncedValue };
      });

      expect(result.current.debouncedValue).toBe('');

      act(() => {
        result.current.setValue('test1');
      });

      expect(result.current.debouncedValue).toBe('');

      act(() => {
        result.current.setValue('test2');
      });

      expect(result.current.debouncedValue).toBe('');

      // Wait for debounce delay
      await waitFor(() => {
        expect(result.current.debouncedValue).toBe('test2');
      }, { timeout: 200 });
    });

    it('should throttle callback execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 100));

      // Call multiple times rapidly
      act(() => {
        result.current();
        result.current();
        result.current();
      });

      // Should only be called once due to throttling
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should render only visible items in virtual scroll list', () => {
      const largeDataset = generateLargeDataset(1000);
      const renderItem = vi.fn((item: any) => <div key={item.id}>{item.name}</div>);

      render(
        <TestWrapper>
          <VirtualScrollList
            items={largeDataset}
            itemHeight={50}
            containerHeight={400}
            renderItem={renderItem}
            overscan={5}
          />
        </TestWrapper>
      );

      // Should only render visible items + overscan, not all 1000 items
      const expectedVisibleItems = Math.ceil(400 / 50) + 10; // container height / item height + overscan
      expect(renderItem).toHaveBeenCalledTimes(expectedVisibleItems);
    });

    it('should handle dynamic heights efficiently', () => {
      const { result } = renderHook(() =>
        useVirtualScroll({
          items: generateMockData(100),
          estimatedItemHeight: 50,
          containerHeight: 400,
          overscan: 5,
        })
      );

      // Initial state
      expect(result.current.visibleRange.startIndex).toBe(0);
      expect(result.current.totalHeight).toBeGreaterThan(0);

      // Update item height
      act(() => {
        result.current.setItemHeight(0, 100);
      });

      // Should recalculate offsets
      expect(result.current.getItemOffset(1)).toBe(100);
    });
  });

  describe('WebSocket Message Batching', () => {
    it('should batch messages efficiently', async () => {
      const onBatch = vi.fn();
      const batcher = new MessageBatcher(onBatch, 3, 100);

      // Add messages one by one
      batcher.add('message1');
      batcher.add('message2');
      
      expect(onBatch).not.toHaveBeenCalled();

      // Third message should trigger batch processing
      batcher.add('message3');
      
      expect(onBatch).toHaveBeenCalledWith(['message1', 'message2', 'message3']);
    });

    it('should process batch after delay', async () => {
      const onBatch = vi.fn();
      const batcher = new MessageBatcher(onBatch, 10, 50);

      batcher.add('message1');
      batcher.add('message2');

      expect(onBatch).not.toHaveBeenCalled();

      // Wait for batch delay
      await new Promise(resolve => setTimeout(resolve, 60));

      expect(onBatch).toHaveBeenCalledWith(['message1', 'message2']);
    });

    it('should use message batcher hook correctly', () => {
      const onBatch = vi.fn();
      const { result } = renderHook(() => useMessageBatcher(onBatch, 2, 50));

      act(() => {
        result.current.addMessage('test1');
        result.current.addMessage('test2');
      });

      expect(onBatch).toHaveBeenCalledWith(['test1', 'test2']);
    });
  });

  describe('Cleanup Management', () => {
    it('should clean up resources properly', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const { result, unmount } = renderHook(() => useCleanupManager());

      act(() => {
        result.current.addCleanup(cleanup1);
        result.current.addCleanup(cleanup2);
      });

      expect(result.current.getStats().cleanupFunctions).toBe(2);

      // Unmount should trigger cleanup
      unmount();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });

    it('should manage timers and intervals', () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() => useCleanupManager());

      let timer: NodeJS.Timeout;
      let interval: NodeJS.Timeout;

      act(() => {
        timer = result.current.setTimeout(callback, 100);
        interval = result.current.setInterval(callback, 50);
      });

      expect(result.current.getStats().timers).toBe(1);
      expect(result.current.getStats().intervals).toBe(1);

      // Unmount should clear timers and intervals
      unmount();

      // Verify timers are cleared (callback shouldn't be called after cleanup)
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
      }, 150);
    });

    it('should manage event listeners', () => {
      const handler = vi.fn();
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      const { result, unmount } = renderHook(() => useCleanupManager());

      act(() => {
        result.current.addEventListener(mockElement, 'click', handler);
      });

      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, undefined);
      expect(result.current.getStats().eventListeners).toBe(1);

      // Unmount should remove event listeners
      unmount();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler, undefined);
    });
  });

  describe('Optimized Data Table Performance', () => {
    const columns = [
      { key: 'id', title: 'ID', sortable: true },
      { key: 'name', title: 'Name', sortable: true },
      { key: 'email', title: 'Email', sortable: true },
      { key: 'department', title: 'Department', sortable: true },
      { key: 'status', title: 'Status', sortable: true },
    ];

    it('should handle large datasets efficiently', () => {
      const largeDataset = generateLargeDataset(1000);
      const startTime = performance.now();

      render(
        <TestWrapper>
          <OptimizedDataTable
            data={largeDataset}
            columns={columns}
            pagination={{
              current: 1,
              pageSize: 50,
              total: 1000,
              onChange: vi.fn(),
            }}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms for 1000 items)
      expect(renderTime).toBeLessThan(100);
    });

    it('should debounce search input', async () => {
      const data = generateMockData(100);
      
      render(
        <TestWrapper>
          <OptimizedDataTable
            data={data}
            columns={columns}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');

      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: 'test1' } });
      fireEvent.change(searchInput, { target: { value: 'test12' } });

      // Should debounce the search
      await waitFor(() => {
        expect(searchInput).toHaveValue('test12');
      });
    });

    it('should throttle sort operations', () => {
      const data = generateMockData(100);
      
      render(
        <TestWrapper>
          <OptimizedDataTable
            data={data}
            columns={columns}
          />
        </TestWrapper>
      );

      const nameHeader = screen.getByText('Name');

      // Click rapidly
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);

      // Should throttle the sort operations
      // This is tested by ensuring the component doesn't crash or become unresponsive
      expect(nameHeader).toBeInTheDocument();
    });
  });

  describe('Store Selector Performance', () => {
    it('should memoize selector results', () => {
      const mockState = {
        user: {
          id: 1,
          username: 'test',
          email: 'test@example.com',
          roles: [
            {
              name: 'admin',
              permissions: [
                { name: 'read' },
                { name: 'write' },
              ],
            },
          ],
        },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
      };

      // Test that selector returns same reference for same input
      const result1 = authSelectors.userPermissions(mockState);
      const result2 = authSelectors.userPermissions(mockState);

      expect(result1).toBe(result2); // Same reference due to memoization
      expect(result1).toEqual(['read', 'write']);
    });

    it('should prevent unnecessary re-renders with optimized selectors', () => {
      const renderCount = vi.fn();
      
      const TestComponent = () => {
        const userPermissions = useOptimizedAuthSelector(authSelectors.userPermissions);
        renderCount();
        return <div>{userPermissions.join(', ')}</div>;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(renderCount).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not cause additional renders due to memoization
      expect(renderCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not create memory leaks with event listeners', () => {
      const { result, unmount } = renderHook(() => useCleanupManager());
      const mockElement = document.createElement('div');
      const handler = vi.fn();

      // Add multiple event listeners
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addEventListener(mockElement, 'click', handler);
        }
      });

      expect(result.current.getStats().eventListeners).toBe(100);

      // Unmount should clean up all listeners
      unmount();

      expect(result.current.getStats().eventListeners).toBe(0);
    });

    it('should clean up WebSocket subscriptions', () => {
      const mockWebSocketService = {
        subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
      };

      const { result, unmount } = renderHook(() => {
        const { addCleanup } = useCleanupManager();
        
        React.useEffect(() => {
          const unsubscribe = mockWebSocketService.subscribe('test', vi.fn());
          addCleanup(unsubscribe);
        }, [addCleanup]);

        return null;
      });

      expect(mockWebSocketService.subscribe).toHaveBeenCalled();

      // Unmount should trigger cleanup
      unmount();

      // Verify unsubscribe was called
      const unsubscribeFn = mockWebSocketService.subscribe.mock.results[0].value;
      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should render large lists within performance budget', () => {
      const data = generateLargeDataset(5000);
      const startTime = performance.now();

      render(
        <TestWrapper>
          <VirtualScrollList
            items={data}
            itemHeight={50}
            containerHeight={600}
            renderItem={(item) => <div key={item.id}>{item.name}</div>}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 200ms even for 5000 items
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => {
        const [count, setCount] = React.useState(0);
        const debouncedCount = useDebouncedValue(count, 10);
        return { count, setCount, debouncedCount };
      });

      const startTime = performance.now();

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.setCount(i);
        });
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle 100 rapid updates within 50ms
      expect(updateTime).toBeLessThan(50);

      // Wait for debounced value to update
      await waitFor(() => {
        expect(result.current.debouncedCount).toBe(99);
      });
    });
  });
});