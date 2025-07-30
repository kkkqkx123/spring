import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPerformanceMonitor,
  measureRenderTime,
  monitorMemoryUsage,
  monitorNetworkPerformance,
  initializePerformanceMonitoring,
} from './performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up performance monitor
    const monitor = getPerformanceMonitor();
    monitor.destroy();
  });

  describe('PerformanceMonitor', () => {
    it('should create a singleton instance', () => {
      const monitor1 = getPerformanceMonitor();
      const monitor2 = getPerformanceMonitor();
      expect(monitor1).toBe(monitor2);
    });

    it('should record metrics', () => {
      const monitor = getPerformanceMonitor();
      const initialMetrics = monitor.getMetrics();
      expect(Array.isArray(initialMetrics)).toBe(true);
    });

    it('should get latest metric by name', () => {
      const monitor = getPerformanceMonitor();
      const latestLCP = monitor.getLatestMetric('LCP');
      // Should be undefined initially or return the latest metric
      expect(latestLCP === undefined || typeof latestLCP === 'object').toBe(true);
    });
  });

  describe('measureRenderTime', () => {
    it('should measure render time', () => {
      const endMeasurement = measureRenderTime('TestComponent');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const renderTime = endMeasurement();
      expect(typeof renderTime).toBe('number');
      expect(renderTime).toBeGreaterThan(0);
    });

    it('should warn about slow renders in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock performance.now to simulate slow render
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(20); // 20ms render time

      const endMeasurement = measureRenderTime('SlowComponent');
      endMeasurement();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow render detected in SlowComponent'),
        expect.stringContaining('20.00ms')
      );

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
      mockNow.mockRestore();
    });
  });

  describe('monitorMemoryUsage', () => {
    it('should return memory information when available', () => {
      const memoryInfo = monitorMemoryUsage();
      
      expect(memoryInfo).toEqual({
        usedJSHeapSize: expect.any(Number),
        totalJSHeapSize: expect.any(Number),
        jsHeapSizeLimit: expect.any(Number),
      });
    });

    it('should warn about high memory usage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock high memory usage
      const mockMemory = {
        usedJSHeapSize: 85 * 1048576, // 85MB
        totalJSHeapSize: 100 * 1048576, // 100MB
        jsHeapSizeLimit: 100 * 1048576, // 100MB (85% usage)
      };
      
      // Mock the performance.memory property
      const originalMemory = (performance as any).memory;
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
        writable: true,
      });

      monitorMemoryUsage();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage detected'),
        expect.stringContaining('85.0%')
      );

      // Restore original memory
      Object.defineProperty(performance, 'memory', {
        value: originalMemory,
        configurable: true,
        writable: true,
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('monitorNetworkPerformance', () => {
    it('should return network information when available', () => {
      const networkInfo = monitorNetworkPerformance();
      
      expect(networkInfo).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    it('should return null when connection API is not available', () => {
      const originalConnection = (navigator as any).connection;
      
      // Mock undefined connection
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const networkInfo = monitorNetworkPerformance();
      expect(networkInfo).toBeNull();

      // Restore original connection
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        configurable: true,
        writable: true,
      });
    });
  });

  describe('initializePerformanceMonitoring', () => {
    it('should initialize performance monitoring without errors', () => {
      expect(() => {
        initializePerformanceMonitoring();
      }).not.toThrow();
    });

    it('should set up event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      initializePerformanceMonitoring();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Performance Thresholds', () => {
    it('should correctly rate LCP performance', () => {
      const monitor = getPerformanceMonitor();
      
      // Test good LCP (≤ 2500ms)
      expect(monitor['getLCPRating'](2000)).toBe('good');
      
      // Test needs improvement LCP (2500-4000ms)
      expect(monitor['getLCPRating'](3000)).toBe('needs-improvement');
      
      // Test poor LCP (> 4000ms)
      expect(monitor['getLCPRating'](5000)).toBe('poor');
    });

    it('should correctly rate FID performance', () => {
      const monitor = getPerformanceMonitor();
      
      // Test good FID (≤ 100ms)
      expect(monitor['getFIDRating'](50)).toBe('good');
      
      // Test needs improvement FID (100-300ms)
      expect(monitor['getFIDRating'](200)).toBe('needs-improvement');
      
      // Test poor FID (> 300ms)
      expect(monitor['getFIDRating'](400)).toBe('poor');
    });

    it('should correctly rate CLS performance', () => {
      const monitor = getPerformanceMonitor();
      
      // Test good CLS (≤ 0.1)
      expect(monitor['getCLSRating'](0.05)).toBe('good');
      
      // Test needs improvement CLS (0.1-0.25)
      expect(monitor['getCLSRating'](0.2)).toBe('needs-improvement');
      
      // Test poor CLS (> 0.25)
      expect(monitor['getCLSRating'](0.3)).toBe('poor');
    });
  });
});