import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
import { lazyImport, lazyWithRetry, preloadComponent } from './lazyImport';
import { measureRenderPerformance } from '../test/performance-setup';

// Mock components for testing
const MockComponent = () => React.createElement('div', { 'data-testid': 'mock-component' }, 'Mock Component');
const SlowMockComponent = () => {
  // Simulate slow component
  const start = Date.now();
  while (Date.now() - start < 50) {
    // Busy wait for 50ms
  }
  return React.createElement('div', { 'data-testid': 'slow-mock-component' }, 'Slow Mock Component');
};

// Helper function to create Suspense wrapper
const createSuspenseWrapper = (component: React.ComponentType, fallbackText = 'Loading...') => {
  return React.createElement(
    Suspense,
    { fallback: React.createElement('div', {}, fallbackText) },
    React.createElement(component)
  );
};

describe('Lazy Import Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lazyImport', () => {
    it('should create lazy component without performance impact', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: MockComponent });
      
      const renderTime = await measureRenderPerformance(async () => {
        const LazyComponent = lazyImport(mockImport);
        
        render(createSuspenseWrapper(LazyComponent));
        
        await waitFor(() => {
          expect(mockImport).toHaveBeenCalledTimes(1);
        });
      });

      // Lazy import creation should be fast (< 10ms)
      expect(renderTime).toBeLessThan(10);
    });

    it('should handle import errors gracefully', async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error('Import failed'));
      
      const LazyComponent = lazyImport(mockImport);
      
      const { getByText } = render(createSuspenseWrapper(LazyComponent));

      // Should show loading initially
      expect(getByText('Loading...')).toBeInTheDocument();
      
      // Error should be handled by error boundary
      await waitFor(() => {
        expect(mockImport).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('lazyWithRetry', () => {
    it('should retry failed imports with exponential backoff', async () => {
      let callCount = 0;
      const mockImport = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ default: MockComponent });
      });

      const LazyComponent = lazyWithRetry(mockImport, 3);
      
      const startTime = performance.now();
      
      render(createSuspenseWrapper(LazyComponent));

      await waitFor(() => {
        expect(mockImport).toHaveBeenCalledTimes(3);
      }, { timeout: 5000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should have taken some time due to retries with backoff
      expect(totalTime).toBeGreaterThan(100); // At least 100ms for retries
      expect(callCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error('Persistent error'));
      
      const LazyComponent = lazyWithRetry(mockImport, 2);
      
      render(createSuspenseWrapper(LazyComponent));

      await waitFor(() => {
        expect(mockImport).toHaveBeenCalledTimes(2);
      }, { timeout: 3000 });
    });
  });

  describe('preloadComponent', () => {
    it('should preload component without blocking', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: MockComponent });
      
      const startTime = performance.now();
      
      // Preload should not block
      preloadComponent(mockImport);
      
      const endTime = performance.now();
      const preloadTime = endTime - startTime;

      // Preload should be nearly instantaneous
      expect(preloadTime).toBeLessThan(5);
      
      // Import should be called asynchronously
      await waitFor(() => {
        expect(mockImport).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle preload errors silently', async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error('Preload failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not throw
      expect(() => {
        preloadComponent(mockImport);
      }).not.toThrow();

      await waitFor(() => {
        expect(mockImport).toHaveBeenCalledTimes(1);
      });

      // Should not log errors (silent failure)
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Bundle Splitting Performance', () => {
    it('should demonstrate code splitting benefits', async () => {
      // Simulate large component that would benefit from code splitting
      const heavyImport = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ default: SlowMockComponent });
          }, 100); // Simulate network delay
        })
      );

      const LazyHeavyComponent = lazyImport(heavyImport);
      
      const renderTime = await measureRenderPerformance(async () => {
        const { getByText } = render(createSuspenseWrapper(LazyHeavyComponent, 'Loading heavy component...'));

        // Should show loading state immediately
        expect(getByText('Loading heavy component...')).toBeInTheDocument();
        
        // Wait for component to load
        await waitFor(() => {
          expect(getByText('Slow Mock Component')).toBeInTheDocument();
        }, { timeout: 1000 });
      });

      // Total render time should include loading time
      expect(renderTime).toBeGreaterThan(100);
      expect(heavyImport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with multiple lazy components', async () => {
      const components = Array.from({ length: 10 }, (_, i) => {
        const mockImport = vi.fn().mockResolvedValue({ 
          default: () => React.createElement('div', {}, `Component ${i}`)
        });
        return lazyImport(mockImport);
      });

      const initialMemory = (performance as any).memory.usedJSHeapSize;

      // Render multiple lazy components
      for (const Component of components) {
        render(createSuspenseWrapper(Component));
      }

      await waitFor(() => {
        // All components should be loaded
        expect(document.querySelectorAll('[data-testid]')).toHaveLength(0);
      });

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 1MB for test components)
      expect(memoryIncrease).toBeLessThan(1048576);
    });
  });
});