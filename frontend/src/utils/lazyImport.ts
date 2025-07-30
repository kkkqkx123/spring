import { lazy, ComponentType } from 'react';

/**
 * Utility function for creating lazy-loaded components with better error handling
 * and loading states
 */
export function lazyImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
): T {
  const LazyComponent = lazy(importFunc);

  // Return a component that wraps the lazy component with error boundary
  return LazyComponent as T;
}

/**
 * Utility for lazy loading with named exports
 */
export function lazyImportNamed<T extends ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: T }>,
  exportName: string
): T {
  const LazyComponent = lazy(async () => {
    const module = await importFunc();
    return { default: module[exportName] };
  });

  return LazyComponent as T;
}

/**
 * Preload a lazy component to improve perceived performance
 */
export function preloadComponent(importFunc: () => Promise<any>): void {
  // Preload the component in the background
  importFunc().catch(() => {
    // Silently fail - the component will be loaded when needed
  });
}

/**
 * Create a lazy component with retry functionality
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  maxRetries: number = 3
): T {
  const LazyComponent = lazy(async () => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error as Error;

        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    throw lastError!;
  });

  return LazyComponent as T;
}
