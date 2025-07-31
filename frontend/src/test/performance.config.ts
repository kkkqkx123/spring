/**
 * Performance testing configuration and utilities
 */

export interface PerformanceThresholds {
  renderTime: number; // Maximum render time in ms
  memoryUsage: number; // Maximum memory usage in MB
  bundleSize: number; // Maximum bundle size in KB
  networkRequests: number; // Maximum number of network requests
  cacheHitRate: number; // Minimum cache hit rate percentage
  frameRate: number; // Minimum frame rate (fps)
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  renderTime: 16, // 60fps
  memoryUsage: 50, // 50MB
  bundleSize: 1000, // 1MB
  networkRequests: 20,
  cacheHitRate: 80, // 80%
  frameRate: 60,
};

export const PERFORMANCE_BUDGETS = {
  // Component render times (ms)
  components: {
    DataTable: 10,
    VirtualScrollList: 5,
    ChatInterface: 15,
    EmployeeForm: 8,
    DepartmentTree: 12,
  },

  // Feature load times (ms)
  features: {
    authentication: 200,
    employeeList: 300,
    chatInterface: 250,
    departmentManagement: 200,
  },

  // Bundle sizes (KB)
  bundles: {
    main: 500,
    vendor: 800,
    chunks: 200,
  },
};

export class PerformanceTestRunner {
  private results: Map<string, number[]> = new Map();

  measureRenderTime<T>(
    testName: string,
    renderFunction: () => T,
    threshold: number = PERFORMANCE_THRESHOLDS.renderTime
  ): T {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.recordResult(testName, renderTime);

    if (renderTime > threshold) {
      console.warn(
        `Performance threshold exceeded for ${testName}: ${renderTime.toFixed(2)}ms > ${threshold}ms`
      );
    }

    return result;
  }

  async measureAsyncOperation<T>(
    testName: string,
    operation: () => Promise<T>,
    threshold: number = 1000
  ): Promise<T> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const operationTime = endTime - startTime;

    this.recordResult(testName, operationTime);

    if (operationTime > threshold) {
      console.warn(
        `Async operation threshold exceeded for ${testName}: ${operationTime.toFixed(2)}ms > ${threshold}ms`
      );
    }

    return result;
  }

  measureMemoryUsage(testName: string): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB

      this.recordResult(`${testName}_memory`, memoryUsage);

      if (memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
        console.warn(
          `Memory usage threshold exceeded for ${testName}: ${memoryUsage.toFixed(2)}MB > ${PERFORMANCE_THRESHOLDS.memoryUsage}MB`
        );
      }

      return memoryUsage;
    }
    return 0;
  }

  private recordResult(testName: string, value: number): void {
    if (!this.results.has(testName)) {
      this.results.set(testName, []);
    }
    this.results.get(testName)!.push(value);
  }

  getResults(): Map<string, number[]> {
    return new Map(this.results);
  }

  getAverageResult(testName: string): number {
    const results = this.results.get(testName);
    if (!results || results.length === 0) return 0;

    return results.reduce((sum, value) => sum + value, 0) / results.length;
  }

  getPercentile(testName: string, percentile: number): number {
    const results = this.results.get(testName);
    if (!results || results.length === 0) return 0;

    const sorted = [...results].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  generateReport(): string {
    const report = ['Performance Test Report', '='.repeat(50), ''];

    for (const [testName, results] of this.results) {
      const avg = this.getAverageResult(testName);
      const p95 = this.getPercentile(testName, 95);
      const p99 = this.getPercentile(testName, 99);
      const min = Math.min(...results);
      const max = Math.max(...results);

      report.push(`${testName}:`);
      report.push(`  Average: ${avg.toFixed(2)}ms`);
      report.push(`  P95: ${p95.toFixed(2)}ms`);
      report.push(`  P99: ${p99.toFixed(2)}ms`);
      report.push(`  Min: ${min.toFixed(2)}ms`);
      report.push(`  Max: ${max.toFixed(2)}ms`);
      report.push(`  Samples: ${results.length}`);
      report.push('');
    }

    return report.join('\n');
  }

  clearResults(): void {
    this.results.clear();
  }
}

export const performanceTestRunner = new PerformanceTestRunner();

// Utility functions for performance testing
export function createLargeDataset(
  size: number,
  itemFactory?: (index: number) => any
) {
  const defaultFactory = (index: number) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    value: Math.random() * 1000,
    timestamp: Date.now() + index,
  });

  return Array.from({ length: size }, (_, index) =>
    itemFactory ? itemFactory(index) : defaultFactory(index)
  );
}

export function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function measureFrameRate(duration: number = 1000): Promise<number> {
  return new Promise(resolve => {
    let frameCount = 0;
    const startTime = performance.now();

    function countFrame() {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frameCount / duration) * 1000;
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

export function detectLongTasks(): Promise<PerformanceEntry[]> {
  return new Promise(resolve => {
    const longTasks: PerformanceEntry[] = [];

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        longTasks.push(...list.getEntries());
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(longTasks);
        }, 5000);
      } catch (error) {
        resolve([]);
      }
    } else {
      resolve([]);
    }
  });
}

export function analyzeRenderBlocking(): {
  blockingResources: PerformanceResourceTiming[];
  totalBlockingTime: number;
} {
  const resourceEntries = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  const blockingResources = resourceEntries.filter(entry => {
    // Consider CSS and synchronous JS as render-blocking
    return (
      (entry.name.includes('.css') ||
        (entry.name.includes('.js') && !entry.name.includes('async'))) &&
      entry.renderBlockingStatus === 'blocking'
    );
  });

  const totalBlockingTime = blockingResources.reduce(
    (total, resource) => total + resource.duration,
    0
  );

  return {
    blockingResources,
    totalBlockingTime,
  };
}

export function measureInteractionToNextPaint(): Promise<number> {
  return new Promise(resolve => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const inpEntry = entries.find(
          entry => entry.name === 'interaction-to-next-paint'
        );

        if (inpEntry) {
          observer.disconnect();
          resolve(inpEntry.duration);
        }
      });

      try {
        observer.observe({ entryTypes: ['event'] });

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } catch (error) {
        resolve(0);
      }
    } else {
      resolve(0);
    }
  });
}
