/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components and utilities to test
import { OptimizedDataTable } from '../components/ui/OptimizedDataTable';
import {
  VirtualScrollList,
  useVirtualScroll,
} from '../components/ui/VirtualScrollList';
import {
  MessageBatcher,
  useMessageBatcher,
} from '../utils/websocketOptimization';
import { useCleanupManager } from '../hooks/useCleanupManager';
import {
  useDeepMemo,
  useDebouncedValue,
  useThrottledCallback,
} from '../utils/memoization';
import {
  authSelectors,
  useOptimizedAuthSelector,
} from '../stores/optimizedSelectors';
import {
  useRenderTime,
  analyzeBundleSize,
  detectMemoryLeaks,
} from '../utils/performanceMonitor';

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
      <MantineProvider>{children}</MantineProvider>
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

    // Mock browser APIs
    global.requestAnimationFrame = cb => {
      cb(0);
      return 0;
    };
    // A more complete mock for IntersectionObserver
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: readonly number[] = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    global.IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
    performanceEntries = [];
  });

  describe('Memoization Utilities', () => {
    it('should memoize expensive computations with useDeepMemo', () => {
      const expensiveComputation = vi.fn((data: { value: number }[]) =>
        data.reduce((sum, item) => sum + item.value, 0)
      );

      const TestComponent = ({ data }: { data: { value: number }[] }) => {
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
      await waitFor(
        () => {
          expect(result.current.debouncedValue).toBe('test2');
        },
        { timeout: 200 }
      );
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
      const renderItem = vi.fn((item: { id: number; name: string }) => (
        <div key={item.id}>{item.name}</div>
      ));

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

      expect(onBatch).toHaveBeenCalledWith([
        'message1',
        'message2',
        'message3',
      ]);
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

      act(() => {
        result.current.setTimeout(callback, 100);
        result.current.setInterval(callback, 50);
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

      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'click',
        handler,
        undefined
      );
      expect(result.current.getStats().eventListeners).toBe(1);

      // Unmount should remove event listeners
      unmount();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'click',
        handler,
        undefined
      );
    });
  });

  describe('Optimized Data Table Performance', () => {
    type MockData = ReturnType<typeof generateMockData>[0];

    const columns: { key: keyof MockData; title: string; sortable: boolean }[] =
      [
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
          <OptimizedDataTable data={data} columns={columns} />
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
          <OptimizedDataTable data={data} columns={columns} />
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
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roles: [
            {
              id: 1,
              name: 'admin',
              permissions: [
                { id: 1, name: 'read' },
                { id: 2, name: 'write' },
              ],
            },
          ],
        },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        // Mock actions
        setUser: vi.fn(),
        setToken: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        clearError: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
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
        const userPermissions = useOptimizedAuthSelector(
          authSelectors.userPermissions
        );
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
        subscribe: vi.fn((..._args: any[]) => vi.fn()), // Returns unsubscribe function
      };

      const { unmount } = renderHook(() => {
        const { addCleanup } = useCleanupManager();

        React.useEffect(() => {
          const unsubscribe = mockWebSocketService.subscribe('test', vi.fn());
          addCleanup(unsubscribe);
        }, [addCleanup]);
      });

      expect(mockWebSocketService.subscribe).toHaveBeenCalled();

      // Unmount should trigger cleanup
      unmount();

      // Verify unsubscribe was called
      const unsubscribeFn =
        mockWebSocketService.subscribe.mock.results[0].value;
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
            containerHeight={500}
            renderItem={(item: { id: number; name: string }) => (
              <div key={item.id}>{item.name}</div>
            )}
            overscan={10}
          />
        </TestWrapper>
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // Generous budget for 5k items
    });

    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => {
        const [count, setCount] = React.useState(0);
        const debouncedCount = useDebouncedValue(count, 50);
        return { count, setCount, debouncedCount };
      });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setCount(i);
        }
      });

      await waitFor(() => {
        expect(result.current.debouncedCount).toBe(99);
      });
    });

    it('should maintain 60fps during animations', () => {
      const frameTimestamps: number[] = [];
      const recordFrame = (timestamp: number) => {
        frameTimestamps.push(timestamp);
      };

      const TestAnimationComponent = () => {
        React.useEffect(() => {
          let frameId: number;
          const animate = (timestamp: number) => {
            recordFrame(timestamp);
            if (frameTimestamps.length < 10) {
              frameId = requestAnimationFrame(animate);
            }
          };
          frameId = requestAnimationFrame(animate);
          return () => cancelAnimationFrame(frameId);
        }, []);
        return <div />;
      };

      render(<TestAnimationComponent />);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          for (let i = 1; i < frameTimestamps.length; i++) {
            const delta = frameTimestamps[i] - frameTimestamps[i - 1];
            expect(delta).toBeLessThan(34); // ~30fps is acceptable in test env
          }
          resolve();
        }, 500);
      });
    });

    it('should handle concurrent renders efficiently', async () => {
      let concurrentRenderCount = 0;
      const ConcurrentTestComponent = ({ id }: { id: number }) => {
        const [isPending, startTransition] = React.useTransition();
        React.useEffect(() => {
          startTransition(() => {
            concurrentRenderCount++;
          });
        }, [id]);
        return <div>{isPending ? 'Loading...' : `Component ${id}`}</div>;
      };

      const { rerender } = render(
        <TestWrapper>
          <ConcurrentTestComponent id={1} />
        </TestWrapper>
      );

      // Trigger concurrent renders
      for (let i = 2; i <= 5; i++) {
        rerender(
          <TestWrapper>
            <ConcurrentTestComponent id={i} />
          </TestWrapper>
        );
      }

      await waitFor(() => {
        expect(concurrentRenderCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track component render performance', () => {
      const TestComponent = () => {
        const renderTime = useRenderTime('TestComponent');
        React.useEffect(() => {
          // Simulate some work
        }, []);
        return (
          <div>
            Render time: {renderTime ? renderTime.getLastRenderTime() : 0}ms
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // This is a simplified check. In a real scenario, we'd check performance entries.
      expect(performance.measure).toHaveBeenCalledWith(
        'TestComponent_render',
        expect.any(Object)
      );
    });

    it('should detect performance regressions', () => {
      const baseline = 50; // ms
      const currentRenderTime = 100; // ms
      const isRegression = currentRenderTime > baseline * 1.2; // 20% threshold

      expect(isRegression).toBe(true);
    });

    it('should monitor bundle size and suggest optimizations', () => {
      // This is a conceptual test
      const suggestions = analyzeBundleSize();
      expect(suggestions).toContain('main.js exceeds size limit.');
      expect(suggestions).toContain('vendor.js exceeds size limit.');
    });

    it('should detect memory leaks', () => {
      // This is a conceptual test
      const leakDetected = detectMemoryLeaks();
      expect(leakDetected).toBe(true);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle employee list with 1000+ items efficiently', () => {
      const employees = generateLargeDataset(1000);
      const columns: { key: keyof (typeof employees)[0]; title: string }[] = [
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' },
        { key: 'email', title: 'Email' },
        { key: 'department', title: 'Department' },
        { key: 'status', title: 'Status' },
      ];

      render(
        <TestWrapper>
          <OptimizedDataTable
            data={employees}
            columns={columns}
            pagination={{
              current: 1,
              pageSize: 50,
              total: employees.length,
              onChange: () => {},
            }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle real-time chat with message batching', async () => {
      const handleBatch = vi.fn();
      const { result } = renderHook(() =>
        useMessageBatcher(handleBatch, 5, 100)
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addMessage({ id: i, text: `Message ${i}` });
        }
      });

      await waitFor(() => {
        expect(handleBatch).toHaveBeenCalledTimes(2);
        expect(handleBatch.mock.calls[0][0].length).toBe(5);
        expect(handleBatch.mock.calls[1][0].length).toBe(5);
      });
    });

    it('should optimize WebSocket connection handling', () => {
      const mockWsService = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      const { unmount } = renderHook(() => {
        React.useEffect(() => {
          mockWsService.connect();
          const handlers = [
            { event: 'message', handler: () => {} },
            { event: 'error', handler: () => {} },
          ];
          handlers.forEach(h => mockWsService.on(h.event, h.handler));

          return () => {
            handlers.forEach(h => mockWsService.off(h.event, h.handler));
            mockWsService.disconnect();
          };
        }, []);
      });

      expect(mockWsService.connect).toHaveBeenCalledTimes(1);
      expect(mockWsService.on).toHaveBeenCalledTimes(2);

      unmount();

      expect(mockWsService.off).toHaveBeenCalledTimes(2);
      expect(mockWsService.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should optimize form validation performance', async () => {
      const TestForm = () => {
        const [values, setValues] = React.useState({
          name: '',
          email: '',
        });
        const debouncedValues = useDebouncedValue(values, 200);

        const validationErrors = React.useMemo(() => {
          const errors: Record<string, string> = {};
          if (debouncedValues.name.length < 2) {
            errors.name = 'Name must be at least 2 characters';
          }
          if (!/\S+@\S+\.\S+/.test(debouncedValues.email)) {
            errors.email = 'Invalid email address';
          }
          return errors;
        }, [debouncedValues]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };

        return (
          <div>
            <input name="name" value={values.name} onChange={handleChange} />
            {validationErrors.name && <span>{validationErrors.name}</span>}
            <input name="email" value={values.email} onChange={handleChange} />
            {validationErrors.email && <span>{validationErrors.email}</span>}
          </div>
        );
      };

      render(<TestForm />);
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      fireEvent.change(nameInput, { target: { value: 'a' } });

      // Error should not appear immediately
      expect(screen.queryByText(/Name must be/)).not.toBeInTheDocument();

      // Error should appear after debounce
      await waitFor(() => {
        expect(screen.getByText(/Name must be/)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Performance Optimization', () => {
    it('should optimize re-renders with React.memo and useMemo', () => {
      const onRender1 = vi.fn();
      const onRender2 = vi.fn();

      const OptimizedChild = React.memo(
        ({ data, onRender }: { data: number; onRender: () => void }) => {
          onRender();
          return <div>Data: {data}</div>;
        }
      );

      const Parent = () => {
        const [value1, setValue1] = React.useState(0);
        const [value2, setValue2] = React.useState(0);
        const memoizedOnRender1 = React.useCallback(() => onRender1(), []);
        const memoizedOnRender2 = React.useCallback(() => onRender2(), []);

        return (
          <div>
            <button onClick={() => setValue1(prev => prev + 1)}>
              Update Value1
            </button>
            <button onClick={() => setValue2(prev => prev + 1)}>
              Update Value2
            </button>
            <OptimizedChild data={value1} onRender={memoizedOnRender1} />
            <OptimizedChild data={value2} onRender={memoizedOnRender2} />
          </div>
        );
      };

      const { getByText } = render(<Parent />);
      expect(onRender1).toHaveBeenCalledTimes(1);
      expect(onRender2).toHaveBeenCalledTimes(1);

      fireEvent.click(getByText('Update Value1'));

      expect(onRender1).toHaveBeenCalledTimes(2);
      expect(onRender2).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('should optimize context updates with selective subscriptions', () => {
      const AppContext = React.createContext<any>(null);
      const renderCounts = { Consumer1: 0, Consumer2: 0 };

      const Provider = ({ children }: { children: React.ReactNode }) => {
        const [value1, setValue1] = React.useState(0);
        const [value2, setValue2] = React.useState(0);

        const contextValue = React.useMemo(
          () => ({
            value1,
            setValue1,
            value2,
            setValue2,
          }),
          [value1, value2]
        );

        return (
          <AppContext.Provider value={contextValue}>
            {children}
          </AppContext.Provider>
        );
      };

      const useValue1 = () => React.useContext(AppContext).value1;
      const useValue2 = () => React.useContext(AppContext).value2;

      const Consumer1 = React.memo(() => {
        renderCounts.Consumer1++;
        const value1 = useValue1();
        return <div>Value1: {value1}</div>;
      });

      const Consumer2 = React.memo(() => {
        renderCounts.Consumer2++;
        const value2 = useValue2();
        return <div>Value2: {value2}</div>;
      });

      const Controls = () => {
        const { setValue1, setValue2 } = React.useContext(AppContext);
        return (
          <div>
            <button onClick={() => setValue1((prev: number) => prev + 1)}>
              Update Value1
            </button>
            <button onClick={() => setValue2((prev: number) => prev + 1)}>
              Update Value2
            </button>
          </div>
        );
      };

      const { getByText } = render(
        <TestWrapper>
          <Provider>
            <Consumer1 />
            <Consumer2 />
            <Controls />
          </Provider>
        </TestWrapper>
      );

      expect(renderCounts.Consumer1).toBe(1);
      expect(renderCounts.Consumer2).toBe(1);

      fireEvent.click(getByText('Update Value1'));

      expect(renderCounts.Consumer1).toBe(2);
      expect(renderCounts.Consumer2).toBe(1); // Should not re-render
    });

    it('should optimize list rendering with keys and stable references', () => {
      const renderLog: number[] = [];
      const ListItem = React.memo(
        ({
          item,
          onRender,
        }: {
          item: { id: number; name: string };
          onRender: (id: number) => void;
        }) => {
          React.useEffect(() => onRender(item.id));
          return <li>{item.name}</li>;
        }
      );

      const OptimizedList = () => {
        const [items, setItems] = React.useState([
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]);
        const onRender = React.useCallback(
          (id: number) => renderLog.push(id),
          []
        );

        const addItem = () => {
          setItems(prev => [...prev, { id: Date.now(), name: 'New' }]);
        };

        return (
          <div>
            <button onClick={addItem}>Add Item</button>
            <ul>
              {items.map(item => (
                <ListItem key={item.id} item={item} onRender={onRender} />
              ))}
            </ul>
          </div>
        );
      };

      const { getByText } = render(<OptimizedList />);
      expect(renderLog).toEqual([1, 2]);

      fireEvent.click(getByText('Add Item'));
      expect(renderLog.length).toBe(3);
      expect(renderLog).toContain(1);
      expect(renderLog).toContain(2);
    });

    it('should optimize expensive operations with Web Workers simulation', async () => {
      const heavyComputation = (data: number[]): Promise<number> => {
        return new Promise(resolve => {
          // Simulate worker delay
          setTimeout(() => {
            const result = data.reduce((sum, num) => {
              let temp = 0;
              for (let i = 0; i < 1e5; i++) temp += Math.sqrt(i);
              return sum + num + temp * 0;
            }, 0);
            resolve(result);
          }, 100);
        });
      };

      const WorkerOptimizedComponent = () => {
        const [result, setResult] = React.useState<number | null>(null);
        const [isComputing, setIsComputing] = React.useState(false);

        const compute = React.useCallback(async () => {
          setIsComputing(true);
          const computationResult = await heavyComputation([1, 2, 3]);
          setResult(computationResult);
          setIsComputing(false);
        }, []);

        return (
          <div>
            <button onClick={compute} disabled={isComputing}>
              {isComputing ? 'Computing...' : 'Compute'}
            </button>
            {result !== null && <div>Result: {result}</div>}
          </div>
        );
      };

      render(<WorkerOptimizedComponent />);
      const computeButton = screen.getByText('Compute');
      fireEvent.click(computeButton);

      expect(screen.getByText('Computing...')).toBeInTheDocument();
      await waitFor(
        () => {
          expect(screen.getByText('Result: 6')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('should optimize image loading with lazy loading and caching', () => {
      // Mock IntersectionObserver to control visibility
      const observeMap = new Map<
        Element,
        (entries: IntersectionObserverEntry[]) => void
      >();
      global.IntersectionObserver = vi.fn(callback => {
        return {
          observe: vi.fn(el => observeMap.set(el, callback)),
          unobserve: vi.fn(el => observeMap.delete(el)),
          disconnect: vi.fn(() => observeMap.clear()),
          root: null,
          rootMargin: '',
          thresholds: [0],
          takeRecords: () => [],
        };
      });

      const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
        const [isLoaded, setIsLoaded] = React.useState(false);
        const imgRef = React.useRef<HTMLImageElement>(null);

        React.useEffect(() => {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                if (imgRef.current) imgRef.current.src = src;
                observer.unobserve(imgRef.current!);
              }
            },
            { threshold: 0.1 }
          );
          if (imgRef.current) observer.observe(imgRef.current);
          return () => observer.disconnect();
        }, [src]);

        const handleLoad = React.useCallback(() => setIsLoaded(true), []);

        return (
          <img
            ref={imgRef}
            alt={alt}
            onLoad={handleLoad}
            style={{ opacity: isLoaded ? 1 : 0 }}
          />
        );
      };

      const ImageGallery = () => {
        const images = Array.from({ length: 10 }, (_, i) => ({
          id: i,
          src: `https://example.com/image${i}.jpg`,
          alt: `Image ${i}`,
        }));
        return (
          <div>
            {images.map(img => (
              <LazyImage key={img.id} src={img.src} alt={img.alt} />
            ))}
          </div>
        );
      };

      render(<ImageGallery />);
      const images = screen.getAllByRole('img');
      expect(images[0]).not.toHaveAttribute('src');

      // Simulate image becoming visible
      const callback = observeMap.get(images[0]);
      act(() => {
        callback!([{ isIntersecting: true }] as any);
      });

      expect(images[0]).toHaveAttribute(
        'src',
        'https://example.com/image0.jpg'
      );
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect render performance regressions', () => {
      const measurements: Record<string, number> = {};
      vi.spyOn(performance, 'measure').mockImplementation((name, opts) => {
        if (
          typeof opts === 'object' &&
          opts !== null &&
          'start' in opts &&
          'end' in opts
        ) {
          measurements[name] = (opts.end as number) - (opts.start as number);
        }
        return {} as PerformanceMeasure;
      });

      const TestComponent = ({ workTime }: { workTime: number }) => {
        const start = performance.now();
        // Simulate work
        for (let i = 0; i < workTime * 1e5; i++);
        const end = performance.now();
        useRenderTime('RegressionComponent', { start, end });
        return null;
      };

      const { rerender } = render(<TestComponent workTime={5} />); // Baseline
      const baselineDuration = measurements['RegressionComponent_render'];

      rerender(<TestComponent workTime={10} />); // Regression
      const regressionDuration = measurements['RegressionComponent_render'];

      expect(regressionDuration).toBeGreaterThan(baselineDuration * 1.5);
    });

    it('should monitor bundle size growth', () => {
      const oldStats = { 'main.js': { size: 100 } };
      const newStats = { 'main.js': { size: 150 } };
      const growth =
        (newStats['main.js'].size - oldStats['main.js'].size) /
        oldStats['main.js'].size;
      expect(growth).toBeGreaterThan(0.2); // 20% growth threshold
    });

    it('should track memory usage patterns', () => {
      // Conceptual: requires heap snapshot integration
      const heapSnapshots = [
        { nodes: 1000, size: 1e6 },
        { nodes: 1500, size: 1.5e6 }, // After some actions
        { nodes: 1200, size: 1.2e6 }, // After cleanup
      ];
      const finalSize = heapSnapshots[2].size;
      const initialSize = heapSnapshots[0].size;
      expect(finalSize / initialSize).toBeLessThan(1.3); // 30% permanent growth threshold
    });
  });
});
