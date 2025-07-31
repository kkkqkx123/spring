/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics interface
interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Custom interfaces for non-standard APIs
interface PerformanceWithMemory extends Performance {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface NavigatorWithConnection extends Navigator {
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

// Performance observer for Core Web Vitals
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          if (lastEntry) {
            this.recordMetric({
              name: 'LCP',
              value: lastEntry.startTime,
              rating: this.getLCPRating(lastEntry.startTime),
              timestamp: Date.now(),
            });
          }
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries() as PerformanceEventTiming[];
          entries.forEach(entry => {
            this.recordMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              rating: this.getFIDRating(
                entry.processingStart - entry.startTime
              ),
              timestamp: Date.now(),
            });
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries() as LayoutShift[];
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            timestamp: Date.now(),
          });
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Send to analytics service (if configured)
    this.sendToAnalytics(metric);

    // Log poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} performance:`, metric.value);
    }
  }

  private sendToAnalytics(metric: PerformanceMetrics) {
    // In a real application, send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// Bundle size monitoring
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log initial bundle size information
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigationEntry) {
      console.group('Bundle Performance Info');
      console.log(
        'DOM Content Loaded:',
        navigationEntry.domContentLoadedEventEnd -
          navigationEntry.domContentLoadedEventStart,
        'ms'
      );
      console.log(
        'Load Complete:',
        navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        'ms'
      );
      console.log(
        'Total Load Time:',
        navigationEntry.loadEventEnd - navigationEntry.fetchStart,
        'ms'
      );
      console.groupEnd();
    }
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory;

    const memoryInfo = {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Memory Usage:', memoryInfo);
    }

    // Warn if memory usage is high
    const usagePercentage =
      (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    if (usagePercentage > 80) {
      console.warn(
        'High memory usage detected:',
        usagePercentage.toFixed(1) + '%'
      );
    }

    return memoryInfo;
  }

  return null;
};

// Component render time measurement
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(
        `Slow render detected in ${componentName}:`,
        renderTime.toFixed(2) + 'ms'
      );
    }

    return renderTime;
  };
};

// Network performance monitoring
export const monitorNetworkPerformance = () => {
  if ('connection' in navigator) {
    const connection = (navigator as NavigatorWithConnection).connection;

    const networkInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Network Info:', networkInfo);
    }

    return networkInfo;
  }

  return null;
};

// Resource loading performance
export const monitorResourceLoading = () => {
  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  const slowResources = resources.filter(resource => {
    const loadTime = resource.responseEnd - resource.startTime;
    return loadTime > 1000; // Resources taking more than 1 second
  });

  if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
    console.group('Slow Resources Detected');
    slowResources.forEach(resource => {
      const loadTime = resource.responseEnd - resource.startTime;
      console.warn(`${resource.name}: ${loadTime.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  return {
    totalResources: resources.length,
    slowResources: slowResources.length,
    averageLoadTime:
      resources.reduce((sum, r) => sum + (r.responseEnd - r.startTime), 0) /
      resources.length,
  };
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Start performance monitoring
  getPerformanceMonitor();

  // Log bundle info after load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logBundleInfo();
      monitorResourceLoading();
      monitorNetworkPerformance();
    }, 1000);
  });

  // Monitor memory usage periodically
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      monitorMemoryUsage();
    }, 30000); // Every 30 seconds
  }
};
