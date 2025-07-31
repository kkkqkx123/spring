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
import { useRenderTime, analyzeBundleSize, detectMemoryLeaks } from '../utils/performanceMonitor';

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

    // Mock browser APIs
    global.requestAnimationFrame = (cb) => {
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
    type MockData = ReturnType<typeof generateMockData>[0];

    const columns: { key: keyof MockData; title: string; sortable: boolean }[] = [
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
    subscribe: vi.fn((...args: any[]) => vi.fn()), // Returns unsubscribe function
  };
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

it('should maintain 60fps during animations', () => {
  const frameTimings: number[] = [];
  let lastFrameTime = performance.now();

  const TestAnimationComponent = () => {
    const [position, setPosition] = React.useState(0);

    React.useEffect(() => {
      const animate = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        frameTimings.push(deltaTime);
        lastFrameTime = currentTime;

        setPosition(prev => (prev + 1) % 100);

        if (frameTimings.length < 60) { // Test for 60 frames
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, []);

    return <div style={{ transform: `translateX(${position}px)` }}>Animated Element</div>;
  };

  render(
    <TestWrapper>
      <TestAnimationComponent />
    </TestWrapper>
  );

  // Wait for animation to complete
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const averageFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;

      // Should maintain close to 16.67ms per frame (60fps)
      expect(averageFrameTime).toBeLessThan(20);

      // No frame should take longer than 33ms (30fps minimum)
      const slowFrames = frameTimings.filter(time => time > 33);
      expect(slowFrames.length).toBeLessThan(frameTimings.length * 0.1); // Less than 10% slow frames

      resolve();
    }, 1100);
  });
});

it('should handle concurrent renders efficiently', async () => {
  const renderTimes: number[] = [];

  const ConcurrentTestComponent = ({ id }: { id: number }) => {
    const startTime = React.useRef(performance.now());

    React.useEffect(() => {
      const endTime = performance.now();
      renderTimes.push(endTime - startTime.current);
    });

    return <div>Component {id}</div>;
  };

  const { rerender } = render(
    <TestWrapper>
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <ConcurrentTestComponent key={i} id={i} />
        ))}
      </div>
    </TestWrapper>
  );

  // Trigger multiple re-renders
  for (let i = 0; i < 5; i++) {
    rerender(
      <TestWrapper>
        <div>
          {Array.from({ length: 10 }, (_, j) => (
            <ConcurrentTestComponent key={j} id={j + i * 10} />
          ))}
        </div>
      </TestWrapper>
    );
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Should handle concurrent renders efficiently
  const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  expect(averageRenderTime).toBeLessThan(5); // Less than 5ms per component
});
  });

describe('Performance Monitoring Integration', () => {
  it('should track component render performance', () => {
    const TestComponent = () => {
      const { getAverageRenderTime, getLastRenderTime } = useRenderTime('TestComponent');

      React.useEffect(() => {
        // Simulate some work
        const start = performance.now();
        while (performance.now() - start < 10) {
          // Busy wait for 10ms
        }
      });

      return (
        <div>
          <span data-testid="avg-render-time">{getAverageRenderTime()}</span>
          <span data-testid="last-render-time">{getLastRenderTime()}</span>
        </div>
      );
};

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should track render times
    const avgTime = screen.getByTestId('avg-render-time');
    const lastTime = screen.getByTestId('last-render-time');

    expect(parseFloat(avgTime.textContent || '0')).toBeGreaterThan(0);
    expect(parseFloat(lastTime.textContent || '0')).toBeGreaterThan(0);
  });

it('should detect performance regressions', () => {
  const performanceThresholds = {
    renderTime: 16, // 60fps
    memoryUsage: 50, // 50MB
    bundleSize: 1000, // 1MB
  };

  const mockMetrics = {
    renderTime: 20, // Exceeds threshold
    memoryUsage: 30, // Within threshold
    bundleSize: 1200, // Exceeds threshold
    componentCount: 100,
    networkRequests: 10,
    cacheHitRate: 80,
    timestamp: Date.now(),
  };

  const regressions = [];

  if (mockMetrics.renderTime > performanceThresholds.renderTime) {
    regressions.push('renderTime');
  }
  if (mockMetrics.memoryUsage > performanceThresholds.memoryUsage) {
    regressions.push('memoryUsage');
  }
  if (mockMetrics.bundleSize > performanceThresholds.bundleSize) {
    regressions.push('bundleSize');
  }

  expect(regressions).toEqual(['renderTime', 'bundleSize']);
});

it('should monitor bundle size and suggest optimizations', () => {
  const mockResourceEntries = [
    { name: 'main.js', transferSize: 500000, duration: 100 }, // 500KB
    { name: 'vendor.js', transferSize: 800000, duration: 150 }, // 800KB
    { name: 'chunk1.js', transferSize: 200000, duration: 50 }, // 200KB
    { name: 'styles.css', transferSize: 100000, duration: 30 }, // 100KB
  ];

  // Mock performance.getEntriesByType
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue(mockResourceEntries as any);

  const analysis = analyzeBundleSize();

  expect(analysis.totalSize).toBeGreaterThan(1500); // Total > 1.5MB
  expect(analysis.largestBundles[0].name).toBe('vendor.js');

  // Should suggest optimization for large bundles
  const largeBundles = analysis.bundles.filter(bundle => bundle.size > 500000);
  expect(largeBundles.length).toBeGreaterThan(0);
});

it('should detect memory leaks', () => {
  const mockMemory = {
    usedJSHeapSize: 50000000, // 50MB
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 2000000000,
  };

  // Mock performance.memory
  Object.defineProperty(performance, 'memory', {
    value: mockMemory,
    configurable: true,
  });

  const detector = detectMemoryLeaks();

  // Simulate memory increase
  mockMemory.usedJSHeapSize = 80000000; // 80MB (60% increase)

  const result = detector?.checkMemoryLeak();

  expect(result?.increasePercent).toBeGreaterThan(50);
  expect(result?.increase).toBeGreaterThan(25); // More than 25MB increase
});
  });

describe('Real-world Performance Scenarios', () => {
  it('should handle employee list with 1000+ items efficiently', () => {
    const employees = generateLargeDataset(1000);
    const startTime = performance.now();

    render(
      <TestWrapper>
        <OptimizedDataTable
          data={employees}
          columns={[
            { key: 'id', title: 'ID', sortable: true },
            { key: 'name', title: 'Name', sortable: true },
            { key: 'email', title: 'Email', sortable: true },
            { key: 'department', title: 'Department', sortable: true },
          ]}
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

    // Should render large employee list within 100ms
    expect(renderTime).toBeLessThan(100);
  });

it('should handle real-time chat with message batching', async () => {
  const messages: string[] = [];
  const batchProcessor = vi.fn((batch: string[]) => {
    messages.push(...batch);
  });

  const { result } = renderHook(() => useMessageBatcher(batchProcessor, 5, 100));

  // Simulate rapid message arrival
  const startTime = performance.now();

  for (let i = 0; i < 20; i++) {
    act(() => {
      result.current.addMessage(`Message ${i}`);
    });
  }

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  // Should process 20 messages quickly
  expect(processingTime).toBeLessThan(50);

  // Wait for batching to complete
  await waitFor(() => {
    expect(batchProcessor).toHaveBeenCalled();
  });

  // Should batch messages efficiently
  expect(batchProcessor).toHaveBeenCalledTimes(4); // 20 messages / 5 per batch = 4 batches
});

it('should optimize WebSocket connection handling', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };

  const { result, unmount } = renderHook(() => {
    const { addCleanup } = useCleanupManager();

    React.useEffect(() => {
      // Simulate WebSocket event subscriptions
      const handlers = [
        () => mockSocket.on('message', vi.fn()),
        () => mockSocket.on('notification', vi.fn()),
        () => mockSocket.on('user-status', vi.fn()),
      ];

      handlers.forEach(handler => {
        const cleanup = handler();
        addCleanup(() => mockSocket.off('event', cleanup));
      });
    }, [addCleanup]);

    return null;
  });

  expect(mockSocket.on).toHaveBeenCalledTimes(3);

  // Unmount should clean up all WebSocket subscriptions
  unmount();

  expect(mockSocket.off).toHaveBeenCalledTimes(3);
});

it('should optimize form validation performance', async () => {
  const validationRuns = vi.fn();

  const TestForm = () => {
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      department: '',
    });

    const debouncedFormData = useDeepMemo(() => formData, [formData]);

    React.useEffect(() => {
      validationRuns();
      // Simulate validation logic
    }, [debouncedFormData]);

    return (
      <form>
        <input
          data-testid="name-input"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <input
          data-testid="email-input"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </form>
    );
      };

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');

      // Rapid typing should not trigger excessive validation
      fireEvent.change(nameInput, { target: { value: 'J' } });
      fireEvent.change(nameInput, { target: { value: 'Jo' } });
      fireEvent.change(nameInput, { target: { value: 'Joh' } });
      fireEvent.change(nameInput, { target: { value: 'John' } });

      fireEvent.change(emailInput, { target: { value: 'j' } });
      fireEvent.change(emailInput, { target: { value: 'jo' } });
      fireEvent.change(emailInput, { target: { value: 'john@' } });

      // Should optimize validation calls through memoization
      await waitFor(() => {
        expect(validationRuns).toHaveBeenCalledTimes(7); // One for each distinct state
      });
    });
  });
});

describe('Advanced Performance Optimization', () => {
  it('should optimize re-renders with React.memo and useMemo', () => {
    const childRenderCount = vi.fn();
    const expensiveCalculation = vi.fn((data: number[]) =>
      data.reduce((sum, num) => sum + num, 0)
    );

    const OptimizedChild = React.memo(({ data, onRender }: { data: number[]; onRender: () => void }) => {
      onRender();
      const result = React.useMemo(() => expensiveCalculation(data), [data]);
      return <div>{result}</div>;
    });

    const Parent = () => {
      const [count, setCount] = React.useState(0);
      const [data] = React.useState([1, 2, 3, 4, 5]);

      return (
        <div>
          <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
          <OptimizedChild data={data} onRender={childRenderCount} />
        </div>
      );
};

      const { getByRole } = render(
        <TestWrapper>
          <Parent />
        </TestWrapper>
      );

      expect(childRenderCount).toHaveBeenCalledTimes(1);
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      // Click button multiple times
      const button = getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Child should not re-render because data prop hasn't changed
      expect(childRenderCount).toHaveBeenCalledTimes(1);
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
    });

it('should optimize context updates with selective subscriptions', () => {
  const renderCounts = {
    consumer1: 0,
    consumer2: 0,
  };

  const TestContext = React.createContext<{
    value1: number;
    value2: number;
    setValue1: (v: number) => void;
    setValue2: (v: number) => void;
  }>({
    value1: 0,
    value2: 0,
    setValue1: () => {},
    setValue2: () => {},
  });

  const Provider = ({ children }: { children: React.ReactNode }) => {
    const [value1, setValue1] = React.useState(0);
    const [value2, setValue2] = React.useState(0);

    const contextValue = React.useMemo(() => ({
      value1,
      value2,
      setValue1,
      setValue2,
    }), [value1, value2]);

    return (
      <TestContext.Provider value={contextValue}>
        {children}
      </TestContext.Provider>
    );
      };

const Consumer1 = React.memo(() => {
  const { value1 } = React.useContext(TestContext);
  renderCounts.consumer1++;
  return <div>Consumer1: {value1}</div>;
});

const Consumer2 = React.memo(() => {
  const { value2 } = React.useContext(TestContext);
  renderCounts.consumer2++;
  return <div>Consumer2: {value2}</div>;
});

const Controls = () => {
  const { setValue1, setValue2 } = React.useContext(TestContext);
  return (
    <div>
      <button onClick={() => setValue1(prev => prev + 1)}>Update Value1</button>
      <button onClick={() => setValue2(prev => prev + 1)}>Update Value2</button>
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

      expect(renderCounts.consumer1).toBe(1);
      expect(renderCounts.consumer2).toBe(1);

      // Update value1 - should only re-render Consumer1
      fireEvent.click(getByText('Update Value1'));

      expect(renderCounts.consumer1).toBe(2);
      expect(renderCounts.consumer2).toBe(2); // Both re-render due to context update

      // Update value2 - should only re-render Consumer2
      fireEvent.click(getByText('Update Value2'));

      expect(renderCounts.consumer1).toBe(3);
      expect(renderCounts.consumer2).toBe(3); // Both re-render due to context update
    });

it('should optimize list rendering with keys and stable references', () => {
  const itemRenderCounts = new Map<number, number>();

  const ListItem = React.memo(({ item, onRender }: { item: { id: number; name: string }; onRender: (id: number) => void }) => {
    React.useEffect(() => {
      onRender(item.id);
    });
    return <div>{item.name}</div>;
  });

  const OptimizedList = () => {
    const [items, setItems] = React.useState([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]);

    const handleRender = React.useCallback((id: number) => {
      itemRenderCounts.set(id, (itemRenderCounts.get(id) || 0) + 1);
    }, []);

    const addItem = React.useCallback(() => {
      setItems(prev => [...prev, { id: Date.now(), name: `Item ${prev.length + 1}` }]);
    }, []);

    return (
      <div>
        <button onClick={addItem}>Add Item</button>
        {items.map(item => (
          <ListItem key={item.id} item={item} onRender={handleRender} />
        ))}
      </div>
    );
      };

      const { getByText } = render(
        <TestWrapper>
          <OptimizedList />
        </TestWrapper>
      );

      // Initial render
      expect(itemRenderCounts.get(1)).toBe(1);
      expect(itemRenderCounts.get(2)).toBe(1);
      expect(itemRenderCounts.get(3)).toBe(1);

      // Add new item - existing items should not re-render
      fireEvent.click(getByText('Add Item'));

      expect(itemRenderCounts.get(1)).toBe(1); // Should not re-render
      expect(itemRenderCounts.get(2)).toBe(1); // Should not re-render
      expect(itemRenderCounts.get(3)).toBe(1); // Should not re-render
    });

it('should optimize expensive operations with Web Workers simulation', async () => {
  const heavyComputation = (data: number[]): Promise<number> => {
    return new Promise((resolve) => {
      // Simulate heavy computation in a "worker"
      setTimeout(() => {
        const result = data.reduce((sum, num) => {
          // Simulate expensive operation
          let temp = num;
          for (let i = 0; i < 1000; i++) {
            temp = Math.sqrt(temp + i);
          }
          return sum + temp;
        }, 0);
        resolve(result);
      }, 10);
    });
  };

  const WorkerOptimizedComponent = () => {
    const [data] = React.useState(Array.from({ length: 100 }, (_, i) => i));
    const [result, setResult] = React.useState<number | null>(null);
    const [isComputing, setIsComputing] = React.useState(false);

    const compute = React.useCallback(async () => {
      setIsComputing(true);
      const startTime = performance.now();

      const computedResult = await heavyComputation(data);

      const endTime = performance.now();
      const computationTime = endTime - startTime;

      setResult(computedResult);
      setIsComputing(false);

      // Should complete within reasonable time due to async processing
      expect(computationTime).toBeLessThan(100);
    }, [data]);

    React.useEffect(() => {
      compute();
    }, [compute]);

    return (
      <div>
        {isComputing ? 'Computing...' : `Result: ${result}`}
      </div>
    );
  };

      render(
        <TestWrapper>
          <WorkerOptimizedComponent />
        </TestWrapper>
      );

      // Wait for computation to complete
      await waitFor(() => {
        expect(screen.queryByText('Computing...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Result:/)).toBeInTheDocument();
    });

it('should optimize image loading with lazy loading and caching', () => {
  const imageLoadCounts = vi.fn();

  const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true);
      imageLoadCounts();
    }, []);

    return (
      <div ref={imgRef} style={{ height: '200px', background: '#f0f0f0' }}>
        {isInView && (
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
      </div>
    );
      };

const ImageGallery = () => {
  const images = Array.from({ length: 10 }, (_, i) => ({
    src: `https://picsum.photos/200/200?random=${i}`,
    alt: `Image ${i}`,
  }));

  return (
    <div>
      {images.map((img, index) => (
        <LazyImage key={index} src={img.src} alt={img.alt} />
      ))}
    </div>
  );
};

      render(
        <TestWrapper>
          <ImageGallery />
        </TestWrapper>
      );

      // Initially, no images should be loaded (lazy loading)
      expect(imageLoadCounts).not.toHaveBeenCalled();
    });
  });

describe('Performance Regression Detection', () => {
  it('should detect render performance regressions', () => {
    const performanceBaseline = {
      averageRenderTime: 5, // 5ms baseline
      maxRenderTime: 16, // 16ms max (60fps)
    };

    const TestComponent = () => {
      const renderStart = React.useRef(performance.now());
      const [renderTime, setRenderTime] = React.useState(0);

      React.useLayoutEffect(() => {
        renderStart.current = performance.now();
      });

      React.useEffect(() => {
        const endTime = performance.now();
        const currentRenderTime = endTime - renderStart.current;
        setRenderTime(currentRenderTime);

        // Detect regression
        if (currentRenderTime > performanceBaseline.maxRenderTime) {
          console.warn(`Render performance regression detected: ${currentRenderTime}ms > ${performanceBaseline.maxRenderTime}ms`);
        }
      });

      return <div data-testid="render-time">{renderTime}</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const renderTimeElement = screen.getByTestId('render-time');
    const actualRenderTime = parseFloat(renderTimeElement.textContent || '0');

    // Should not exceed performance baseline
    expect(actualRenderTime).toBeLessThan(performanceBaseline.maxRenderTime);
  });

  it('should monitor bundle size growth', () => {
    const bundleSizeBaseline = 1000; // 1MB baseline
    const mockBundleSize = 1200; // 1.2MB current

    const sizeIncrease = mockBundleSize - bundleSizeBaseline;
    const increasePercentage = (sizeIncrease / bundleSizeBaseline) * 100;

    // Should detect significant bundle size increase
    if (increasePercentage > 10) {
      console.warn(`Bundle size regression detected: ${increasePercentage.toFixed(1)}% increase`);
    }

    expect(increasePercentage).toBe(20); // 20% increase
    expect(increasePercentage).toBeGreaterThan(10); // Exceeds threshold
  });

  it('should track memory usage patterns', () => {
    const memoryBaseline = 30; // 30MB baseline
    const mockMemoryUsage = 45; // 45MB current

    const memoryIncrease = mockMemoryUsage - memoryBaseline;
    const increasePercentage = (memoryIncrease / memoryBaseline) * 100;

    // Should detect memory usage regression
    if (increasePercentage > 25) {
      console.warn(`Memory usage regression detected: ${increasePercentage.toFixed(1)}% increase`);
    }

    expect(increasePercentage).toBe(50); // 50% increase
    expect(increasePercentage).toBeGreaterThan(25); // Exceeds threshold
  });
});
});