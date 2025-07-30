import React from 'react';

/**
 * Performance monitoring utilities for tracking and optimizing application performance
 */

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  cacheHitRate: number;
  timestamp: number;
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupObservers();
    this.startMetricsCollection();
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private setupObservers(): void {
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log(`${entry.name}: ${entry.startTime}ms`);
        });
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint timing not supported');
      }

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
            });
          }
        });
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation timing not supported');
      }

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const slowResources = entries.filter(entry => entry.duration > 1000);
        if (slowResources.length > 0) {
          console.warn('Slow resources detected:', slowResources);
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource timing not supported');
      }

      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.warn(`Long task detected: ${entry.duration}ms`);
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task timing not supported');
      }
    }
  }

  private startMetricsCollection(): void {
    const collectMetrics = () => {
      if (!this.isMonitoring) return;

      const metrics: PerformanceMetrics = {
        renderTime: this.measureRenderTime(),
        componentCount: this.countComponents(),
        memoryUsage: this.getMemoryUsage(),
        bundleSize: this.getBundleSize(),
        networkRequests: this.getNetworkRequestCount(),
        cacheHitRate: this.getCacheHitRate(),
        timestamp: Date.now(),
      };

      this.metrics.push(metrics);

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Schedule next collection
      setTimeout(collectMetrics, 5000); // Collect every 5 seconds
    };

    collectMetrics();
  }

  private measureRenderTime(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  private countComponents(): number {
    // Count React components in the DOM (approximate)
    const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
    return reactElements.length;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getBundleSize(): number {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resourceEntries.filter(entry => 
      entry.name.includes('.js') && !entry.name.includes('node_modules')
    );
    
    return jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0) / 1024; // KB
  }

  private getNetworkRequestCount(): number {
    const resourceEntries = performance.getEntriesByType('resource');
    return resourceEntries.length;
  }

  private getCacheHitRate(): number {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cachedResources = resourceEntries.filter(entry => entry.transferSize === 0);
    return resourceEntries.length > 0 ? (cachedResources.length / resourceEntries.length) * 100 : 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce((acc, metric) => ({
      renderTime: acc.renderTime + metric.renderTime,
      componentCount: acc.componentCount + metric.componentCount,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      bundleSize: acc.bundleSize + metric.bundleSize,
      networkRequests: acc.networkRequests + metric.networkRequests,
      cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
    }), {
      renderTime: 0,
      componentCount: 0,
      memoryUsage: 0,
      bundleSize: 0,
      networkRequests: 0,
      cacheHitRate: 0,
    });

    const count = this.metrics.length;
    return {
      renderTime: totals.renderTime / count,
      componentCount: totals.componentCount / count,
      memoryUsage: totals.memoryUsage / count,
      bundleSize: totals.bundleSize / count,
      networkRequests: totals.networkRequests / count,
      cacheHitRate: totals.cacheHitRate / count,
    };
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitorRef = React.useRef<PerformanceMonitor>();

  if (!monitorRef.current) {
    monitorRef.current = new PerformanceMonitor();
  }

  React.useEffect(() => {
    const monitor = monitorRef.current!;
    monitor.start();

    return () => {
      monitor.stop();
    };
  }, []);

  return {
    getMetrics: () => monitorRef.current!.getMetrics(),
    getLatestMetrics: () => monitorRef.current!.getLatestMetrics(),
    getAverageMetrics: () => monitorRef.current!.getAverageMetrics(),
    exportMetrics: () => monitorRef.current!.exportMetrics(),
    clearMetrics: () => monitorRef.current!.clearMetrics(),
  };
}

// Component performance profiler
export function withPerformanceProfiler<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    const renderStart = React.useRef<number>(0);
    const renderCount = React.useRef<number>(0);

    React.useLayoutEffect(() => {
      renderStart.current = performance.now();
    });

    React.useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart.current;
      renderCount.current++;

      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);

      if (renderTime > 16) { // More than one frame (60fps)
        console.warn(`${componentName} slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    });

    return <Component {...props} />;
  });
}

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  const renderStart = React.useRef<number>(0);
  const renderTimes = React.useRef<number[]>([]);

  React.useLayoutEffect(() => {
    renderStart.current = performance.now();
  });

  React.useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }

    const averageRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;

    if (renderTime > 16) {
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms (avg: ${averageRenderTime.toFixed(2)}ms)`);
    }
  });

  return {
    getAverageRenderTime: () => {
      return renderTimes.current.length > 0 
        ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length
        : 0;
    },
    getLastRenderTime: () => {
      return renderTimes.current.length > 0 
        ? renderTimes.current[renderTimes.current.length - 1]
        : 0;
    },
    getRenderCount: () => renderTimes.current.length,
  };
}

// Bundle analyzer utility
export function analyzeBundleSize() {
  const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const bundles = resourceEntries
    .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
    .map(entry => ({
      name: entry.name.split('/').pop() || entry.name,
      size: entry.transferSize || 0,
      loadTime: entry.duration,
      cached: entry.transferSize === 0,
    }))
    .sort((a, b) => b.size - a.size);

  const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
  const cachedSize = bundles.filter(bundle => bundle.cached).reduce((sum, bundle) => sum + bundle.size, 0);

  return {
    bundles,
    totalSize: totalSize / 1024, // KB
    cachedSize: cachedSize / 1024, // KB
    cacheHitRate: totalSize > 0 ? (cachedSize / totalSize) * 100 : 0,
    largestBundles: bundles.slice(0, 5),
  };
}

// Memory leak detector
export function detectMemoryLeaks() {
  if (!('memory' in performance)) {
    console.warn('Memory API not supported');
    return null;
  }

  const memory = (performance as any).memory;
  const initialMemory = memory.usedJSHeapSize;

  return {
    checkMemoryLeak: () => {
      const currentMemory = memory.usedJSHeapSize;
      const memoryIncrease = currentMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

      if (memoryIncreasePercent > 50) {
        console.warn(`Potential memory leak detected: ${memoryIncreasePercent.toFixed(2)}% increase`);
      }

      return {
        initial: initialMemory / 1024 / 1024, // MB
        current: currentMemory / 1024 / 1024, // MB
        increase: memoryIncrease / 1024 / 1024, // MB
        increasePercent: memoryIncreasePercent,
      };
    },
  };
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  globalPerformanceMonitor.start();
}