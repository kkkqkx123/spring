import '@testing-library/jest-dom';

// Mock performance APIs for testing
Object.defineProperty(window, 'performance', {
  value: {
    ...window.performance,
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
  writable: true,
});

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation(_callback => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));
// Add the missing static property to the mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(mockPerformanceObserver as any).supportedEntryTypes = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.PerformanceObserver = mockPerformanceObserver as any;

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
  },
  writable: true,
});

// Performance test utilities
export const measureRenderPerformance = async (
  renderFn: () => Promise<void> | void
) => {
  const startTime = performance.now();
  await renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

interface PerformanceWithMemory extends Performance {
  memory: {
    usedJSHeapSize: number;
  };
}

export const measureMemoryUsage = (testFn: () => void) => {
  const initialMemory = (performance as PerformanceWithMemory).memory
    .usedJSHeapSize;
  testFn();
  const finalMemory = (performance as PerformanceWithMemory).memory
    .usedJSHeapSize;
  return finalMemory - initialMemory;
};
